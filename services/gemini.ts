import { BlockType, DocBlock } from "../types";
import * as pdfjsLib from 'pdfjs-dist';

// Handle ESM import quirk: pdfjs-dist might be exported as default
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Set up the worker for pdfjs
if (pdfjs.GlobalWorkerOptions) {
    // CRITICAL FIX: Use cdnjs for the worker to ensure we get a raw script file, 
    // not an ES Module wrapper (which esm.sh provides), as the worker environment 
    // often fails to load modules directly without specific configuration.
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface ExtractedElement {
  type: 'text' | 'field';
  y: number; // PDF coordinates (0 is bottom typically, but we will use raw values)
  x: number;
  content?: string;
  block?: DocBlock;
}

/**
 * Standard PDF Parser using PDF.js
 * Extracts both text content AND form annotations, reconstructing them in order.
 */
export const parsePDFToModularDoc = async (file: File): Promise<DocBlock[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use the resolved pdfjs object
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const allBlocks: DocBlock[] = [];

    // Iterate through each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const elements: ExtractedElement[] = [];

      // 1. Extract Text Content
      const textContent = await page.getTextContent();
      // textContent.items contains objects with { str, transform }
      // transform is [scaleX, skewY, skewX, scaleY, x, y]
      // PDF coordinate system: Y grows upwards (usually). 
      // We want to sort Top to Bottom. High Y -> Low Y.
      
      for (const item of textContent.items as any[]) {
        const text = item.str;
        if (!text || text.trim().length === 0) continue;
        
        // transform[5] is the y-coordinate (baseline)
        elements.push({
          type: 'text',
          x: item.transform[4],
          y: item.transform[5],
          content: text
        });
      }

      // 2. Extract Annotations (Form Fields)
      const annotations = await page.getAnnotations();
      
      for (const anno of annotations) {
        if (anno.subtype === 'Widget') {
          // anno.rect is [x_bottom_left, y_bottom_left, x_top_right, y_top_right]
          // or similar depending on rotation. 
          // We'll use the "top" Y value for sorting: rect[3]
          const y = anno.rect[3]; 
          const x = anno.rect[0];

          let blockType = BlockType.INPUT;
          let options: string[] | undefined = undefined;

          // Determine Field Type
          if (anno.checkBox) {
            blockType = BlockType.CHECKBOX;
          } else if (anno.radioButton) {
            blockType = BlockType.RADIO;
            // Trying to find options for radios is complex in PDFJS without a full form manager, 
            // but we can default or try to read appearance state.
            options = ['Option 1', 'Option 2']; 
          } else if (anno.fieldType === 'Ch') { // Choice (Dropdown)
             blockType = BlockType.SELECT;
             options = anno.options || ['Option 1'];
          } else if (anno.multiLine) {
             blockType = BlockType.LONG_TEXT;
          }

          const fieldBlock: DocBlock = {
            id: crypto.randomUUID(),
            type: blockType,
            label: anno.fieldName || anno.alternativeText || 'Field',
            variableName: (anno.fieldName || `field_${Date.now()}`).replace(/\s+/g, '_').toLowerCase(),
            options: options,
            required: false // Hard to determine from basic annotation data
          };

          elements.push({
            type: 'field',
            x,
            y,
            block: fieldBlock
          });
        }
      }

      // 3. Sort Elements (Top to Bottom, Left to Right)
      // PDF Y-coords: Higher is higher up the page. Sort Descending Y.
      elements.sort((a, b) => {
        const yDiff = b.y - a.y;
        if (Math.abs(yDiff) > 5) return yDiff; // Significant vertical difference
        return a.x - b.x; // Same line, sort left to right
      });

      // 4. Group Text into Paragraphs/Lines
      let currentTextBlock: DocBlock | null = null;
      let lastY = -1;

      for (const el of elements) {
        if (el.type === 'field' && el.block) {
          // Push any pending text block first
          if (currentTextBlock) {
             allBlocks.push(currentTextBlock);
             currentTextBlock = null;
          }
          allBlocks.push(el.block);
          lastY = el.y;
        } else if (el.type === 'text' && el.content) {
          // Merge logic
          // If we have a current block and this text is roughly on the same line or strictly following it
          // Note: Simple heuristic for now.
          
          if (!currentTextBlock) {
             currentTextBlock = {
                 id: crypto.randomUUID(),
                 type: BlockType.TEXT,
                 content: el.content
             };
          } else {
             // Check if it's a new line (significant Y drop)
             const yDiff = lastY - el.y; 
             // If yDiff is large positive, we dropped down a line.
             // If yDiff is near 0, same line.
             
             // If same line, append with space.
             if (Math.abs(yDiff) < 10) {
                 currentTextBlock.content += ' ' + el.content;
             } else {
                 // New line in same block? Or new block?
                 // Let's keep paragraphs together in one block unless gap is huge
                 if (yDiff > 40) { // Big gap, start new block
                    allBlocks.push(currentTextBlock);
                    currentTextBlock = {
                        id: crypto.randomUUID(),
                        type: BlockType.TEXT,
                        content: el.content
                    };
                 } else {
                    currentTextBlock.content += '\n' + el.content;
                 }
             }
          }
          lastY = el.y;
        }
      }

      // Push final text block of page
      if (currentTextBlock) {
        allBlocks.push(currentTextBlock);
      }
      
      // Add a page break indicator if needed, or just let it flow
      if (pageNum < pdf.numPages) {
          allBlocks.push({
              id: crypto.randomUUID(),
              type: BlockType.SECTION_BREAK,
              label: `Page ${pageNum} End`
          });
      }
    }

    if (allBlocks.length === 0) {
       return [{
           id: crypto.randomUUID(),
           type: BlockType.TEXT,
           content: "> Empty Document or Parse Error."
       }];
    }

    return allBlocks;

  } catch (error) {
    console.error("Error parsing PDF with PDF.js:", error);
    return [{
        id: crypto.randomUUID(),
        type: BlockType.TEXT,
        content: `### Import Failed\n\nError: ${error instanceof Error ? error.message : "Unknown error"}`
    }];
  }
};