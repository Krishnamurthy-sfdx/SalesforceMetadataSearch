export interface StandardFieldValue {
    value: string;
    label: string;
    description?: string;
  }
  
  export interface StandardValueSetValues {
    [standardValueSetName: string]: StandardFieldValue[];
  }
  
  export interface StandardFieldMapping {
    [objectName: string]: {
      [fieldName: string]: string; // Maps to StandardValueSet name
    };
  }
  
  // Salesforce StandardValueSet definitions
  export const STANDARD_VALUE_SETS: StandardValueSetValues = {
    // AccountType StandardValueSet
    AccountType: [
      { value: 'Prospect', label: 'Prospect', description: 'Potential customer' },
      { value: 'Customer - Direct', label: 'Customer - Direct', description: 'Direct customer' },
      { value: 'Customer - Channel', label: 'Customer - Channel', description: 'Channel customer' },
      { value: 'Channel Partner / Reseller', label: 'Channel Partner / Reseller', description: 'Partner or reseller' },
      { value: 'Installation Partner', label: 'Installation Partner', description: 'Installation partner' },
      { value: 'Technology Partner', label: 'Technology Partner', description: 'Technology partner' },
      { value: 'Other', label: 'Other', description: 'Other type' },
    ],
  
    // Industry StandardValueSet
    Industry: [
      { value: 'Agriculture', label: 'Agriculture' },
      { value: 'Apparel', label: 'Apparel' },
      { value: 'Banking', label: 'Banking' },
      { value: 'Biotechnology', label: 'Biotechnology' },
      { value: 'Chemicals', label: 'Chemicals' },
      { value: 'Communications', label: 'Communications' },
      { value: 'Construction', label: 'Construction' },
      { value: 'Consulting', label: 'Consulting' },
      { value: 'Education', label: 'Education' },
      { value: 'Electronics', label: 'Electronics' },
      { value: 'Energy', label: 'Energy' },
      { value: 'Engineering', label: 'Engineering' },
      { value: 'Entertainment', label: 'Entertainment' },
      { value: 'Environmental', label: 'Environmental' },
      { value: 'Finance', label: 'Finance' },
      { value: 'Food & Beverage', label: 'Food & Beverage' },
      { value: 'Government', label: 'Government' },
      { value: 'Healthcare', label: 'Healthcare' },
      { value: 'Hospitality', label: 'Hospitality' },
      { value: 'Insurance', label: 'Insurance' },
      { value: 'Machinery', label: 'Machinery' },
      { value: 'Manufacturing', label: 'Manufacturing' },
      { value: 'Media', label: 'Media' },
      { value: 'Not For Profit', label: 'Not For Profit' },
      { value: 'Other', label: 'Other' },
      { value: 'Recreation', label: 'Recreation' },
      { value: 'Retail', label: 'Retail' },
      { value: 'Shipping', label: 'Shipping' },
      { value: 'Technology', label: 'Technology' },
      { value: 'Telecommunications', label: 'Telecommunications' },
      { value: 'Transportation', label: 'Transportation' },
      { value: 'Utilities', label: 'Utilities' },
    ],
  
    // AccountRating StandardValueSet
    AccountRating: [
      { value: 'Hot', label: 'Hot', description: 'High priority account' },
      { value: 'Warm', label: 'Warm', description: 'Medium priority account' },
      { value: 'Cold', label: 'Cold', description: 'Low priority account' },
    ],
  
    // Salutation StandardValueSet
    Salutation: [
      { value: 'Mr.', label: 'Mr.' },
      { value: 'Ms.', label: 'Ms.' },
      { value: 'Mrs.', label: 'Mrs.' },
      { value: 'Dr.', label: 'Dr.' },
      { value: 'Prof.', label: 'Prof.' },
    ],
  
    // LeadSource StandardValueSet
    LeadSource: [
      { value: 'Web', label: 'Web' },
      { value: 'Phone Inquiry', label: 'Phone Inquiry' },
      { value: 'Partner Referral', label: 'Partner Referral' },
      { value: 'Purchased List', label: 'Purchased List' },
      { value: 'Other', label: 'Other' },
    ],
  
    // LeadStatus StandardValueSet
    LeadStatus: [
      { value: 'Open - Not Contacted', label: 'Open - Not Contacted', description: 'New lead not yet contacted' },
      { value: 'Working - Contacted', label: 'Working - Contacted', description: 'Lead has been contacted' },
      { value: 'Closed - Converted', label: 'Closed - Converted', description: 'Lead converted to opportunity' },
      { value: 'Closed - Not Converted', label: 'Closed - Not Converted', description: 'Lead closed without conversion' },
    ],
  
    // OpportunityStage StandardValueSet
    OpportunityStage: [
      { value: 'Prospecting', label: 'Prospecting', description: 'Initial stage' },
      { value: 'Qualification', label: 'Qualification', description: 'Qualifying the opportunity' },
      { value: 'Needs Analysis', label: 'Needs Analysis', description: 'Analyzing customer needs' },
      { value: 'Value Proposition', label: 'Value Proposition', description: 'Presenting value proposition' },
      { value: 'Id. Decision Makers', label: 'Id. Decision Makers', description: 'Identifying decision makers' },
      { value: 'Perception Analysis', label: 'Perception Analysis', description: 'Analyzing customer perception' },
      { value: 'Proposal/Price Quote', label: 'Proposal/Price Quote', description: 'Providing proposal or quote' },
      { value: 'Negotiation/Review', label: 'Negotiation/Review', description: 'Negotiating terms' },
      { value: 'Closed Won', label: 'Closed Won', description: 'Successfully closed' },
      { value: 'Closed Lost', label: 'Closed Lost', description: 'Lost opportunity' },
    ],
  
    // OpportunityType StandardValueSet
    OpportunityType: [
      { value: 'Existing Customer - Upgrade', label: 'Existing Customer - Upgrade' },
      { value: 'Existing Customer - Replacement', label: 'Existing Customer - Replacement' },
      { value: 'Existing Customer - Downgrade', label: 'Existing Customer - Downgrade' },
      { value: 'New Customer', label: 'New Customer' },
    ],
  
    // CaseStatus StandardValueSet
    CaseStatus: [
      { value: 'New', label: 'New', description: 'Newly created case' },
      { value: 'Working', label: 'Working', description: 'Case being worked on' },
      { value: 'Escalated', label: 'Escalated', description: 'Case has been escalated' },
      { value: 'Closed', label: 'Closed', description: 'Case is closed' },
    ],
  
    // CasePriority StandardValueSet
    CasePriority: [
      { value: 'High', label: 'High', description: 'High priority case' },
      { value: 'Medium', label: 'Medium', description: 'Medium priority case' },
      { value: 'Low', label: 'Low', description: 'Low priority case' },
    ],
  
    // CaseOrigin StandardValueSet
    CaseOrigin: [
      { value: 'Phone', label: 'Phone' },
      { value: 'Email', label: 'Email' },
      { value: 'Web', label: 'Web' },
    ],
  
    // CaseType StandardValueSet
    CaseType: [
      { value: 'Question', label: 'Question' },
      { value: 'Problem', label: 'Problem' },
      { value: 'Feature Request', label: 'Feature Request' },
    ],
  
    // CaseReason StandardValueSet
    CaseReason: [
      { value: 'Installation', label: 'Installation' },
      { value: 'Equipment Complexity', label: 'Equipment Complexity' },
      { value: 'Performance', label: 'Performance' },
      { value: 'Breakdown', label: 'Breakdown' },
      { value: 'Equipment Design', label: 'Equipment Design' },
      { value: 'Other', label: 'Other' },
    ],
  
    // TaskStatus StandardValueSet
    TaskStatus: [
      { value: 'Not Started', label: 'Not Started', description: 'Task not yet started' },
      { value: 'In Progress', label: 'In Progress', description: 'Task in progress' },
      { value: 'Completed', label: 'Completed', description: 'Task completed' },
      { value: 'Waiting on someone else', label: 'Waiting on someone else', description: 'Waiting for others' },
      { value: 'Deferred', label: 'Deferred', description: 'Task deferred' },
    ],
  
    // TaskPriority StandardValueSet
    TaskPriority: [
      { value: 'High', label: 'High', description: 'High priority task' },
      { value: 'Normal', label: 'Normal', description: 'Normal priority task' },
      { value: 'Low', label: 'Low', description: 'Low priority task' },
    ],
  
    // TaskType StandardValueSet
    TaskType: [
      { value: 'Call', label: 'Call' },
      { value: 'Email', label: 'Email' },
      { value: 'Meeting', label: 'Meeting' },
      { value: 'Other', label: 'Other' },
    ],
  
    // EventType StandardValueSet
    EventType: [
      { value: 'Call', label: 'Call' },
      { value: 'Meeting', label: 'Meeting' },
      { value: 'Other', label: 'Other' },
    ],
  
    // CampaignStatus StandardValueSet
    CampaignStatus: [
      { value: 'Planned', label: 'Planned', description: 'Campaign is planned' },
      { value: 'In Progress', label: 'In Progress', description: 'Campaign is active' },
      { value: 'Completed', label: 'Completed', description: 'Campaign completed' },
      { value: 'Aborted', label: 'Aborted', description: 'Campaign was aborted' },
    ],
  
    // CampaignType StandardValueSet
    CampaignType: [
      { value: 'Conference', label: 'Conference' },
      { value: 'Webinar', label: 'Webinar' },
      { value: 'Trade Show', label: 'Trade Show' },
      { value: 'Public Relations', label: 'Public Relations' },
      { value: 'Partners', label: 'Partners' },
      { value: 'Referral Program', label: 'Referral Program' },
      { value: 'Advertisement', label: 'Advertisement' },
      { value: 'Banner Ads', label: 'Banner Ads' },
      { value: 'Direct Mail', label: 'Direct Mail' },
      { value: 'Email', label: 'Email' },
      { value: 'Telemarketing', label: 'Telemarketing' },
      { value: 'Other', label: 'Other' },
    ],
  
    // ContractStatus StandardValueSet
    ContractStatus: [
      { value: 'Draft', label: 'Draft', description: 'Contract in draft' },
      { value: 'In Approval Process', label: 'In Approval Process', description: 'Contract being approved' },
      { value: 'Activated', label: 'Activated', description: 'Contract is active' },
      { value: 'Terminated', label: 'Terminated', description: 'Contract terminated' },
      { value: 'Expired', label: 'Expired', description: 'Contract expired' },
    ],
  
    // ProductFamily StandardValueSet
    ProductFamily: [
      { value: 'None', label: 'None' },
    ],
  
    // UserType StandardValueSet
    UserType: [
      { value: 'Standard', label: 'Standard', description: 'Standard user' },
      { value: 'PowerCustomerSuccess', label: 'Customer Community Plus', description: 'Customer Community Plus user' },
      { value: 'PowerPartner', label: 'Partner Community', description: 'Partner Community user' },
      { value: 'CustomerSuccess', label: 'Customer Community', description: 'Customer Community user' },
      { value: 'CsnOnly', label: 'Chatter Only', description: 'Chatter only user' },
      { value: 'CspLitePortal', label: 'High Volume Customer Portal', description: 'High volume portal user' },
    ],
  };
  
  // Mapping of object fields to their StandardValueSet names
  export const STANDARD_FIELD_MAPPING: StandardFieldMapping = {
    Account: {
      Type: 'AccountType',
      Industry: 'Industry',
      Rating: 'AccountRating',
    },
    Contact: {
      Salutation: 'Salutation',
      LeadSource: 'LeadSource',
    },
    Lead: {
      Status: 'LeadStatus',
      LeadSource: 'LeadSource',
      Rating: 'AccountRating',
      Industry: 'Industry',
    },
    Opportunity: {
      StageName: 'OpportunityStage',
      Type: 'OpportunityType',
      LeadSource: 'LeadSource',
    },
    Case: {
      Status: 'CaseStatus',
      Priority: 'CasePriority',
      Origin: 'CaseOrigin',
      Type: 'CaseType',
      Reason: 'CaseReason',
    },
    Task: {
      Status: 'TaskStatus',
      Priority: 'TaskPriority',
      Type: 'TaskType',
    },
    Event: {
      Type: 'EventType',
    },
    Campaign: {
      Status: 'CampaignStatus',
      Type: 'CampaignType',
    },
    Contract: {
      Status: 'ContractStatus',
    },
    Product2: {
      Family: 'ProductFamily',
    },
    User: {
      UserType: 'UserType',
    },
  };
  
  // Helper function to get standard values for a field
  export function getStandardFieldValues(
    objectName: string,
    fieldName: string
  ): StandardFieldValue[] | null {
    const objectMapping = STANDARD_FIELD_MAPPING[objectName];
    if (!objectMapping) {
      return null;
    }
    
    const standardValueSetName = objectMapping[fieldName];
    if (!standardValueSetName) {
      return null;
    }
    
    return STANDARD_VALUE_SETS[standardValueSetName] || null;
  }
  
  // Helper function to check if a field has standard values
  export function hasStandardValues(
    objectName: string,
    fieldName: string
  ): boolean {
    return getStandardFieldValues(objectName, fieldName) !== null;
  }
  
  // Helper function to get StandardValueSet name for a field
  export function getStandardValueSetName(
    objectName: string,
    fieldName: string
  ): string | null {
    const objectMapping = STANDARD_FIELD_MAPPING[objectName];
    if (!objectMapping) {
      return null;
    }
    
    return objectMapping[fieldName] || null;
  }
  
  // Helper function to get all available StandardValueSets
  export function getAllStandardValueSets(): string[] {
    return Object.keys(STANDARD_VALUE_SETS);
  }
  
  // Helper function to get values for a specific StandardValueSet
  export function getStandardValueSetValues(
    standardValueSetName: string
  ): StandardFieldValue[] | null {
    return STANDARD_VALUE_SETS[standardValueSetName] || null;
  }