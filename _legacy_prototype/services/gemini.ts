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
      // transform[5] is the y-coordinate (baseline). PDF Y grows upwards.
      for (const item of textContent.items as any[]) {
        const text = item.str;
        if (!text || text.trim().length === 0) continue;
        
        elements.push({
          type: 'text',
          x: item.transform[4],
          y: item.transform[5],
          content: text
        });
      }

      // 2. Extract Annotations (Form Fields)
      const annotations = await page.getAnnotations();
      
      // PRE-PROCESS: Group annotations by fieldName to handle Radio Groups
      const groupedAnnotations: Record<string, any[]> = {};
      const standaloneAnnotations: any[] = [];

      for (const anno of annotations) {
          if (anno.subtype === 'Widget') {
              if (anno.radioButton && anno.fieldName) {
                  if (!groupedAnnotations[anno.fieldName]) {
                      groupedAnnotations[anno.fieldName] = [];
                  }
                  groupedAnnotations[anno.fieldName].push(anno);
              } else {
                  standaloneAnnotations.push(anno);
              }
          }
      }

      // Handle Standalone Fields (Inputs, Checkboxes, Selects)
      for (const anno of standaloneAnnotations) {
          // anno.rect is [x_bottom_left, y_bottom_left, x_top_right, y_top_right]
          const y = anno.rect[3]; 
          const x = anno.rect[0];

          let blockType = BlockType.INPUT;
          let options: string[] | undefined = undefined;

          if (anno.checkBox) {
            blockType = BlockType.CHECKBOX;
          } else if (anno.fieldType === 'Ch') { // Choice (Dropdown/Select)
             blockType = BlockType.SELECT;
             options = anno.options || ['Option 1', 'Option 2'];
          } else if (anno.multiLine) {
             blockType = BlockType.LONG_TEXT;
          } else if (anno.fieldType === 'Tx') {
             blockType = BlockType.INPUT;
          }

          const fieldBlock: DocBlock = {
            id: crypto.randomUUID(),
            type: blockType,
            label: anno.fieldName || anno.alternativeText || 'Field',
            variableName: (anno.fieldName || `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`).replace(/\s+/g, '_').toLowerCase(),
            options: options,
            required: false 
          };

          elements.push({ type: 'field', x, y, block: fieldBlock });
      }

      // Handle Grouped Radios
      for (const fieldName in groupedAnnotations) {
          const group = groupedAnnotations[fieldName];
          if (group.length === 0) continue;

          // Use the position of the first (top-most) radio button as the block position
          // Sort group by Y descending to find top-most
          group.sort((a, b) => b.rect[3] - a.rect[3]);
          const topRadio = group[0];
          
          // Collect options from button values
          const options = group.map(g => g.buttonValue || g.exportValue || 'Option').filter((v, i, a) => a.indexOf(v) === i); // Unique

          const radioBlock: DocBlock = {
              id: crypto.randomUUID(),
              type: BlockType.RADIO,
              label: fieldName || 'Select an option',
              variableName: fieldName.replace(/\s+/g, '_').toLowerCase(),
              options: options.length > 0 ? options : ['Option 1', 'Option 2'],
              required: false
          };

          elements.push({ 
              type: 'field', 
              x: topRadio.rect[0], 
              y: topRadio.rect[3], 
              block: radioBlock 
          });
      }

      // 3. Sort Elements (Top to Bottom, Left to Right)
      elements.sort((a, b) => {
        const yDiff = b.y - a.y;
        if (Math.abs(yDiff) > 5) return yDiff; 
        return a.x - b.x; 
      });

      // 4. Group Text into Paragraphs
      let currentTextBlock: DocBlock | null = null;
      let lastY = -1;

      for (const el of elements) {
        if (el.type === 'field' && el.block) {
          if (currentTextBlock) {
             allBlocks.push(currentTextBlock);
             currentTextBlock = null;
          }
          allBlocks.push(el.block);
          lastY = el.y;
        } else if (el.type === 'text' && el.content) {
          
          if (!currentTextBlock) {
             currentTextBlock = {
                 id: crypto.randomUUID(),
                 type: BlockType.TEXT,
                 content: el.content
             };
          } else {
             const yDiff = lastY - el.y; 
             if (Math.abs(yDiff) < 10) {
                 currentTextBlock.content += ' ' + el.content;
             } else {
                 if (yDiff > 40) { 
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

      if (currentTextBlock) {
        allBlocks.push(currentTextBlock);
      }
      
      if (pageNum < pdf.numPages) {
          allBlocks.push({
              id: crypto.randomUUID(),
              type: BlockType.SECTION_BREAK,
              label: `Page ${pageNum}`
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