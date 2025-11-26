
import { Term } from "../types";

export const STANDARD_LEGAL_TERMS: Term[] = [
    {
        id: 'sys_1',
        term: 'Force Majeure',
        definition: 'Unforeseeable circumstances that prevent someone from fulfilling a contract (e.g., war, natural disasters).',
        source: 'system',
        color: '#f59e0b'
    },
    {
        id: 'sys_2',
        term: 'Indemnification',
        definition: 'Security against legal liability for another\'s actions. Compensation for harm or loss.',
        source: 'system',
        color: '#3b82f6'
    }
];

interface DictionaryTerm {
    term: string;
    definition: string;
    category?: string;
}

export const LEGAL_DICTIONARY_DB: DictionaryTerm[] = [
    // --- GENERAL LAW ---
    { category: "General", term: "Affidavit", definition: "A written statement confirmed by oath or affirmation, for use as evidence in court." },
    { category: "General", term: "Arbitration", definition: "The use of an arbitrator to settle a dispute involved in a contract." },
    { category: "General", term: "Assignment", definition: "The transfer of a right or interest in property or a contract to another party." },
    { category: "General", term: "Beneficiary", definition: "A person who derives advantage from something, especially a trust, will, or life insurance policy." },
    { category: "General", term: "Breach of Contract", definition: "Failure to perform any term of a contract, written or oral, without a legitimate legal excuse." },
    { category: "General", term: "Confidentiality", definition: "A set of rules or a promise that limits access or places restrictions on certain types of information." },
    { category: "General", term: "Consideration", definition: "Something of value given by both parties to a contract that induces them to enter into the agreement." },
    { category: "General", term: "Damages", definition: "A sum of money claimed or awarded in compensation for a loss or an injury." },
    { category: "General", term: "Default", definition: "Failure to fulfill an obligation, especially to repay a loan or appear in a court of law." },
    { category: "General", term: "Defendant", definition: "An individual, company, or institution sued or accused in a court of law." },
    { category: "General", term: "Due Diligence", definition: "Reasonable steps taken by a person in order to satisfy a legal requirement, especially in buying or selling." },
    { category: "General", term: "Encumbrance", definition: "A claim against property by a party that is not the owner (e.g. mortgages, liens)." },
    { category: "General", term: "Escrow", definition: "A bond, deed, or other document kept in the custody of a third party, taking effect only when a specified condition has been fulfilled." },
    { category: "General", term: "Force Majeure", definition: "Unforeseeable circumstances that prevent someone from fulfilling a contract (e.g., war, natural disasters)." },
    { category: "General", term: "Governing Law", definition: "The laws of the state or country that will apply in interpreting the contract." },
    { category: "General", term: "Grantor", definition: "A person or institution that makes a grant or conveyance." },
    { category: "General", term: "Indemnification", definition: "Security against legal liability for another's actions. Compensation for harm or loss." },
    { category: "General", term: "Injunction", definition: "A judicial order that restrains a person from beginning or continuing an action threatening or invading the legal right of another." },
    { category: "General", term: "Insolvency", definition: "The state of being unable to pay debts owed." },
    { category: "General", term: "Intellectual Property", definition: "Intangible property that is the result of creativity, such as patents, copyrights, etc." },
    { category: "General", term: "Jurisdiction", definition: "The official power to make legal decisions and judgments." },
    { category: "General", term: "Liability", definition: "The state of being responsible for something, especially by law." },
    { category: "General", term: "Lien", definition: "A right to keep possession of property belonging to another person until a debt owed by that person is discharged." },
    { category: "General", term: "Litigation", definition: "The process of taking legal action." },
    { category: "General", term: "Mediation", definition: "Intervention in a dispute in order to resolve it; arbitration." },
    { category: "General", term: "Memorandum of Understanding", definition: "A nonbinding agreement between two or more parties outlining the terms and details of an understanding." },
    { category: "General", term: "Negligence", definition: "Failure to take proper care in doing something." },
    { category: "General", term: "Non-Compete", definition: "A clause under which one party (usually an employee) agrees not to enter into or start a similar profession or trade in competition." },
    { category: "General", term: "Non-Disclosure Agreement", definition: "A contract by which one or more parties agree not to disclose confidential information that they have shared." },
    { category: "General", term: "Notary Public", definition: "A person authorized to perform certain legal formalities, especially to draw up or certify contracts, deeds, and other documents." },
    { category: "General", term: "Obligation", definition: "An act or course of action to which a person is morally or legally bound." },
    { category: "General", term: "Party", definition: "A person or group taking part in a contract." },
    { category: "General", term: "Plaintiff", definition: "A person who brings a case against another in a court of law." },
    { category: "General", term: "Power of Attorney", definition: "The authority to act for another person in specified or all legal or financial matters." },
    { category: "General", term: "Precedent", definition: "An earlier event or action that is regarded as an example or guide to be considered in subsequent similar circumstances." },
    { category: "General", term: "Principal", definition: "The person with the highest authority or most important position in an organization, institution, or group." },
    { category: "General", term: "Provision", definition: "A condition or requirement in a legal document." },
    { category: "General", term: "Quorum", definition: "The minimum number of members of an assembly or society that must be present at any of its meetings to make the proceedings of that meeting valid." },
    { category: "General", term: "Remedy", definition: "The means with which a court of law, usually in the exercise of civil law jurisdiction, enforces a right, imposes a penalty, or makes another court order." },
    { category: "General", term: "Severability", definition: "A provision in a contract which states that if parts of the contract are held to be illegal or unenforceable, the remainder of the contract should still apply." },
    { category: "General", term: "Statute", definition: "A written law passed by a legislative body." },
    { category: "General", term: "Subcontractor", definition: "A business or person that carries out work for a company as part of a larger project." },
    { category: "General", term: "Termination", definition: "The action of bringing the contract to an end before its natural conclusion." },
    { category: "General", term: "Testimony", definition: "A formal written or spoken statement, especially one given in a court of law." },
    { category: "General", term: "Trademark", definition: "A symbol, word, or words legally registered or established by use as representing a company or product." },
    { category: "General", term: "Waiver", definition: "An act or instance of waiving a right or claim." },
    { category: "General", term: "Warranty", definition: "A written guarantee, issued to the purchaser of an article by its manufacturer, promising to repair or replace it if necessary within a specified period of time." },
    { category: "General", term: "Witness", definition: "A person who sees an event, typically a crime or accident, take place." },

    // --- MUSIC INDUSTRY ---
    { category: "Music Business", term: "360 Deal", definition: "A contract where a record label receives a percentage of all revenue streams from an artist (touring, merchandise, publishing) not just record sales." },
    { category: "Music Business", term: "Advance", definition: "A pre-payment of royalties given to an artist by a label, which must be recouped before the artist earns further royalties." },
    { category: "Music Business", term: "Mechanical Royalties", definition: "Royalties paid to songwriters when their music is reproduced (CDs, downloads, streaming)." },
    { category: "Music Business", term: "Sync License", definition: "A license granting the right to synchronize music with visual media (TV, Film, Ads)." },
    { category: "Music Business", term: "Master Rights", definition: "Ownership of the actual sound recording, typically held by the record label." },
    { category: "Music Business", term: "Publishing Rights", definition: "Ownership of the underlying musical composition (lyrics/melody), typically held by the songwriter/publisher." },
    { category: "Music Business", term: "Recoupment", definition: "The process of a label repaying advances and costs from the artist's royalty share." },
    { category: "Music Business", term: "Performance Royalties", definition: "Fees paid when music is performed publicly (radio, live venues, streaming)." },
    { category: "Music Business", term: "PRO", definition: "Performance Rights Organization (e.g., ASCAP, BMI) that collects performance royalties." },
    { category: "Music Business", term: "Split Sheet", definition: "A document determining the percentage of ownership each contributor has in a song." },
    
    // --- TECH / SAAS ---
    { category: "Tech & SaaS", term: "SLA", definition: "Service Level Agreement. A commitment between a service provider and a client regarding uptime and performance." },
    { category: "Tech & SaaS", term: "Uptime", definition: "The measure of time a system is operational, usually expressed as a percentage (e.g., 99.9%)." },
    { category: "Tech & SaaS", term: "Data Processing Agreement", definition: "A contract outlining how data will be processed and protected, crucial for GDPR compliance." },
    { category: "Tech & SaaS", term: "API Key", definition: "A code passed in by computer programs calling an API to identify the calling program." },
    { category: "Tech & SaaS", term: "Churn Rate", definition: "The percentage of subscribers who discontinue their subscriptions within a given time period." },
    { category: "Tech & SaaS", term: "Seat", definition: "A single user license in a subscription software model." },
    { category: "Tech & SaaS", term: "Freemium", definition: "A business model where basic services are provided free of charge while more advanced features must be paid for." },
    { category: "Tech & SaaS", term: "Latency", definition: "The delay before a transfer of data begins following an instruction for its transfer." },
    { category: "Tech & SaaS", term: "Encryption", definition: "The process of converting information or data into a code, especially to prevent unauthorized access." },

    // --- REAL ESTATE ---
    { category: "Real Estate", term: "Easement", definition: "A right to cross or otherwise use someone else's land for a specified purpose." },
    { category: "Real Estate", term: "Zoning", definition: "Municipal or local laws or regulations that govern how real property can and cannot be used." },
    { category: "Real Estate", term: "Title Deed", definition: "A legal document constituting evidence of a right, especially to ownership of property." },
    { category: "Real Estate", term: "Leasehold", definition: "The holding of property by lease." },
    { category: "Real Estate", term: "Appraisal", definition: "An expert estimate of the value of something, especially real estate." },
    { category: "Real Estate", term: "Closing Costs", definition: "Fees paid at the closing of a real estate transaction." },
    { category: "Real Estate", term: "Escrow Account", definition: "A temporary pass through account held by a third party during the process of a transaction." },

    // --- MANUFACTURING ---
    { category: "Manufacturing", term: "Bill of Materials", definition: "A comprehensive list of parts, items, assemblies, and other materials required to create a product." },
    { category: "Manufacturing", term: "Lead Time", definition: "The time between the initiation and completion of a production process." },
    { category: "Manufacturing", term: "Just-in-Time", definition: "An inventory strategy companies employ to increase efficiency and decrease waste by receiving goods only as they are needed." },
    { category: "Manufacturing", term: "Quality Assurance", definition: "The maintenance of a desired level of quality in a service or product." },
    { category: "Manufacturing", term: "Supply Chain", definition: "The sequence of processes involved in the production and distribution of a commodity." },
    { category: "Manufacturing", term: "OEM", definition: "Original Equipment Manufacturer. A company that produces parts and equipment that may be marketed by another manufacturer." }
];
