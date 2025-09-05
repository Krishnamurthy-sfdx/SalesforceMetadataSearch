export interface SalesforceObject {
    name: string;
    label: string;
    custom: boolean;
    queryable: boolean;
    recordCount?: number;
  }
  
  export interface SalesforceField {
    name: string;
    label: string;
    type: string;
    length: number;
    custom: boolean;
    required: boolean;
    unique?: boolean;
    nillable?: boolean;
    referenceTo?: string[];
    relationshipName?: string;
    childRelationships?: {
      childSObject: string;
      field: string;
      relationshipName: string;
    }[];
    restrictedPicklist?: boolean;
    cascadeDelete?: boolean;
    picklistValues?: {
      value: string;
      label: string;
      active: boolean;
    }[];
  }
  
  export interface MetadataReference {
    id: string;
    fileName: string;
    type: string;
    references: {
      line: number;
      snippet: string;
      context?: string;
    }[];
  }
  
  export interface SearchResult {
    id: string;
    type: "object" | "field" | "flow" | "apex-class" | "apex-trigger" | "validation-rule" | "record-type" | "page-layout" | "aura-bundle" | "lwc-bundle";
    objectName?: string;
    name: string;
    label: string;
    fieldType?: string;
    description?: string;
    status?: string;
  }
  
  export interface MetadataSearchResult {
    id: string;
    name: string;
    label: string;
    type: string;
    description?: string;
    status?: string;
    objectName?: string;
  }