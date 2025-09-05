import type { 
    SalesforceObject, 
    SalesforceField, 
    MetadataReference 
  } from "@/types/salesforce";
  
  const API_VERSION = "v64.0";
  
  // Escape all SOSL-reserved characters inside FIND {...}
  export function escapeSOSL(input: string): string {
    // Reserved in SOSL: ? & | ! { } [ ] ( ) ^ ~ * : \ " ' + -
    return input.replace(/([\\?&|!{}\[\]()^~*:\\"'\+\-])/g, "\\$1");
  }
  
  // Build a safe REST search URL
  export function buildSearchUrl(base: string, searchTerm: string, objectTypes: string[] = ['ApexClass', 'ApexTrigger']): string {
    const escaped = escapeSOSL(searchTerm);
    const returning = objectTypes.map(type => `${type}(Id,Name)`).join(', ');
    const sosl = `FIND {"${escaped}"} IN ALL FIELDS RETURNING ${returning}`;
    return `${base}/services/data/v64.0/search/?q=${encodeURIComponent(sosl)}`;
  }
  
  export class TokenExpiredError extends Error {
    constructor(message: string = 'Token expired or invalid') {
      super(message);
      this.name = 'TokenExpiredError';
    }
  }
  
  function handleApiError(response: Response, errorText: string) {
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson[0]?.errorCode === 'INVALID_SESSION_ID' || 
          errorJson[0]?.message?.includes('Session expired')) {
        throw new TokenExpiredError(errorJson[0].message);
      }
      if (errorJson[0]?.message) {
        throw new Error(`Salesforce API Error: ${errorJson[0].message}`);
      }
    } catch (parseError) {
      if (parseError instanceof TokenExpiredError) {
        throw parseError;
      }
      // If not JSON, check for 401 status
      if (response.status === 401) {
        throw new TokenExpiredError('Session expired or invalid');
      }
    }
    
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }
  
  export async function fetchSalesforceObjects(
    instanceUrl: string,
    accessToken: string
  ): Promise<SalesforceObject[]> {
    try {
      console.log('Fetching Salesforce objects from:', instanceUrl);
      console.log('Access Token:', accessToken ? `Present (${accessToken.substring(0, 10)}...)` : 'Missing');
      
      // Validate instance URL
      if (!instanceUrl || !instanceUrl.startsWith('https://')) {
        throw new Error(`Invalid instance URL: ${instanceUrl}`);
      }
      
      // Ensure the instance URL is properly formatted
      const cleanInstanceUrl = instanceUrl.replace(/\/$/, '');
      const url = `${cleanInstanceUrl}/services/data/${API_VERSION}/sobjects/`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        handleApiError(response, errorText);
      }
      
      const data = await response.json();
      console.log('API Response received, sobjects count:', data.sobjects?.length || 0);
      
      if (!data.sobjects || !Array.isArray(data.sobjects)) {
        console.error('Invalid API response structure:', data);
        throw new Error('Invalid response structure from Salesforce API');
      }
      
      // Helper function to generate meaningful labels from API names
      const generateLabel = (name: string, originalLabel?: string): string => {
        // If we have a valid original label, use it
        if (originalLabel && originalLabel.trim() && originalLabel !== name) {
          return originalLabel;
        }
        
        // Generate a human-readable label from the API name
        return name
          .replace(/__c$/, '') // Remove custom field suffix
          .replace(/_/g, ' ') // Replace underscores with spaces
          .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };
  
      // Transform Salesforce API response to our format
      const objects: SalesforceObject[] = data.sobjects
        .filter((obj: any) => obj.queryable)
        .map((obj: any) => ({
          name: obj.name,
          label: generateLabel(obj.name, obj.label),
          custom: obj.custom,
          queryable: obj.queryable,
          recordCount: undefined,
        }))
        .sort((a: SalesforceObject, b: SalesforceObject) => a.label.localeCompare(b.label));
      
      console.log('Processed objects count:', objects.length);
      return objects;
      
    } catch (error) {
      console.error('Error fetching objects:', error);
      throw error;
    }
  }
  
  export async function fetchObjectFields(
    instanceUrl: string,
    accessToken: string,
    objectName: string
  ): Promise<SalesforceField[]> {
    try {
      console.log('Fetching fields for object:', objectName);
      console.log('Instance URL:', instanceUrl);
      
      const cleanInstanceUrl = instanceUrl.replace(/\/$/, '');
      const url = `${cleanInstanceUrl}/services/data/${API_VERSION}/sobjects/${objectName}/describe/`;
      console.log('Fields API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log('Fields response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fields API Error Response:', errorText);
        handleApiError(response, errorText);
      }
      
      const data = await response.json();
      console.log('Fields API Response received, fields count:', data.fields?.length || 0);
      
      if (!data.fields || !Array.isArray(data.fields)) {
        console.error('Invalid fields API response structure:', data);
        throw new Error('Invalid response structure from Salesforce Fields API');
      }
      
      // Helper function to generate meaningful labels from field names
      const generateFieldLabel = (name: string, originalLabel?: string): string => {
        // If we have a valid original label, use it
        if (originalLabel && originalLabel.trim() && originalLabel !== name) {
          return originalLabel;
        }
        
        // Generate a human-readable label from the field name
        return name
          .replace(/__c$/, '') // Remove custom field suffix
          .replace(/__pc$/, '') // Remove person account suffix
          .replace(/__r$/, '') // Remove relationship suffix
          .replace(/_/g, ' ') // Replace underscores with spaces
          .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
          .split(' ')
          .map(word => {
            // Handle common abbreviations
            const upperWord = word.toUpperCase();
            if (['ID', 'URL', 'API', 'CRM', 'ERP', 'SLA'].includes(upperWord)) {
              return upperWord;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join(' ');
      };
  
      // Transform Salesforce API response to our format
      const fields: SalesforceField[] = data.fields.map((field: any) => ({
        name: field.name,
        label: generateFieldLabel(field.name, field.label),
        type: field.type,
        length: field.length || 0,
        custom: field.custom,
        required: !field.nillable && !field.defaultedOnCreate,
        unique: field.unique,
        nillable: field.nillable,
        referenceTo: field.referenceTo || [],
        relationshipName: field.relationshipName,
        childRelationships: data.childRelationships?.filter((rel: any) => 
          rel.field === field.name
        ).map((rel: any) => ({
          childSObject: rel.childSObject,
          field: rel.field,
          relationshipName: rel.relationshipName,
        })) || [],
        restrictedPicklist: field.restrictedPicklist,
        cascadeDelete: field.cascadeDelete,
        picklistValues: field.picklistValues || [],
      }));
      
      console.log('Processed fields count:', fields.length);
      return fields;
      
    } catch (error) {
      console.error('Error fetching fields:', error);
      throw error;
    }
  }
  
  export async function fetchFieldMetadata(
    instanceUrl: string,
    accessToken: string,
    objectName: string,
    fieldName: string
  ): Promise<MetadataReference[]> {
    const cleanInstanceUrl = instanceUrl.replace(/\/$/, '');
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  
    // Escape % and _ for SOQL LIKE
    const likeNeedle = `%${fieldName.replace(/[%_]/g, (m) => `\\${m}`)}%`;
  
    const refs: MetadataReference[] = [];
  
    // Helper: run Tooling SOQL, catch & log but don't throw
    const toolingQuery = async (q: string) => {
      const url = `${cleanInstanceUrl}/services/data/${API_VERSION}/tooling/query/?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const txt = await res.text();
        console.warn('Tooling query failed', q, res.status, txt);
        return { records: [] as any[] };
      }
      return res.json();
    };
  
    // 1) SOSL for ApexClass & ApexTrigger (with proper escaping)
    try {
      const searchUrl = buildSearchUrl(cleanInstanceUrl, fieldName, ['ApexClass', 'ApexTrigger']);
      const sRes = await fetch(searchUrl, { headers });
      if (sRes.ok) {
        const data = await sRes.json();
        if (Array.isArray(data.searchRecords)) {
          for (const r of data.searchRecords) {
            const t = r?.attributes?.type;
            if (t === 'ApexClass') {
              refs.push({
                id: `apex-class-${r.Id}`,
                fileName: `${r.Name}.cls`,
                type: 'Apex Class',
                references: [{ line: 1, snippet: `…${fieldName}…`, context: 'Found via SOSL' }],
              });
            } else if (t === 'ApexTrigger') {
              refs.push({
                id: `apex-trigger-${r.Id}`,
                fileName: `${r.Name}.trigger`,
                type: 'Apex Trigger',
                references: [{ line: 1, snippet: `…${fieldName}…`, context: 'Found via SOSL' }],
              });
            }
          }
        }
      } else {
        console.warn('SOSL failed', await sRes.text());
      }
    } catch (e) {
      console.warn('SOSL error', e);
    }
  
    // 2) ApexClass via Tooling (Name LIKE - Body field cannot be filtered)
    try {
      const q = `SELECT Id, Name FROM ApexClass WHERE Name LIKE '${likeNeedle}' LIMIT 100`;
      const { records } = await toolingQuery(q);
      for (const r of records) {
        refs.push({
          id: `apex-class-${r.Id}`,
          fileName: `${r.Name}.cls`,
          type: 'Apex Class',
          references: [{ line: 1, snippet: `…${fieldName}…`, context: 'Tooling: ApexClass.Name LIKE' }],
        });
      }
    } catch (e) {
      console.warn('ApexClass LIKE failed', e);
    }
  
    // 3) ApexTrigger via Tooling (Name LIKE - Body field cannot be filtered)
    try {
      const q = `SELECT Id, Name FROM ApexTrigger WHERE Name LIKE '${likeNeedle}' LIMIT 100`;
      const { records } = await toolingQuery(q);
      for (const r of records) {
        refs.push({
          id: `apex-trigger-${r.Id}`,
          fileName: `${r.Name}.trigger`,
          type: 'Apex Trigger',
          references: [{ line: 1, snippet: `…${fieldName}…`, context: 'Tooling: ApexTrigger.Name LIKE' }],
        });
      }
    } catch (e) {
      console.warn('ApexTrigger LIKE failed', e);
    }
  
    // 4) Aura components (AuraDefinitionBundle.DeveloperName LIKE - Source field cannot be filtered)
    try {
      const q = `
        SELECT Id, DeveloperName
        FROM AuraDefinitionBundle
        WHERE DeveloperName LIKE '${likeNeedle}'
        LIMIT 100
      `;
      const { records } = await toolingQuery(q);
      for (const r of records) {
        refs.push({
          id: `aura-${r.Id}`,
          fileName: `${r.DeveloperName || 'Aura'}.cmp`,
          type: 'Aura Bundle',
          references: [{ line: 1, snippet: `…${fieldName}…`, context: 'Tooling: AuraDefinitionBundle.DeveloperName LIKE' }],
        });
      }
    } catch (e) {
      console.warn('AuraDefinitionBundle LIKE failed', e);
    }
  
    // 5) Lightning Web Components (LightningComponentBundle.DeveloperName LIKE - Source field cannot be filtered)
    try {
      const q = `
        SELECT Id, DeveloperName
        FROM LightningComponentBundle
        WHERE DeveloperName LIKE '${likeNeedle}'
        LIMIT 100
      `;
      const { records } = await toolingQuery(q);
      for (const r of records) {
        refs.push({
          id: `lwc-${r.Id}`,
          fileName: `${r.DeveloperName || 'lwc'}.js`,
          type: 'LWC Bundle',
          references: [{ line: 1, snippet: `…${fieldName}…`, context: 'Tooling: LightningComponentBundle.DeveloperName LIKE' }],
        });
      }
    } catch (e) {
      console.warn('LightningComponentBundle LIKE failed', e);
    }
  
    // 6) Flows (using correct Flow object with proper fields)
    try {
      // Use a more reliable Flow query with proper field names
      const q = `
        SELECT Id, MasterLabel, Status
        FROM Flow
        WHERE Status = 'Active'
        AND MasterLabel != null
        LIMIT 100
      `;
      const { records } = await toolingQuery(q);
      console.log(`Found ${records.length} flows to search`);
      
      // Filter flows that match the search term
      const matchingFlows = records.filter((r: any) => 
        r.MasterLabel && r.MasterLabel.toLowerCase().includes(fieldName.toLowerCase())
      );
      
      for (const r of matchingFlows) {
        refs.push({
          id: `flow-${r.Id}`,
          fileName: `${r.MasterLabel || 'Flow'}.flow`,
          type: 'Flow',
          references: [{ line: 1, snippet: `…${fieldName}…`, context: 'Flow: MasterLabel contains term' }],
        });
      }
      console.log(`Found ${matchingFlows.length} matching flows`);
    } catch (e) {
      console.warn('Flow search failed:', e);
    }
  
    // 7) Validation Rules (using standard fields only)
    try {
      const q = `
        SELECT Id, ValidationName
        FROM ValidationRule
        WHERE ValidationName LIKE '${likeNeedle}'
        LIMIT 100
      `;
      const { records } = await toolingQuery(q);
      for (const r of records) {
        refs.push({
          id: `vr-${r.Id}`,
          fileName: `${objectName}.${r.ValidationName}.validationRule`,
          type: 'Validation Rule',
          references: [{ line: 1, snippet: `…${fieldName}…`, context: 'Tooling: ValidationRule.ValidationName LIKE' }],
        });
      }
    } catch (e) {
      console.warn('ValidationRule LIKE failed', e);
    }
  
    // 8) Record Types (using standard API instead of Tooling API)
    try {
      // Use standard REST API for RecordType as Tooling API has limited fields
      const recordTypeUrl = `${cleanInstanceUrl}/services/data/${API_VERSION}/query/?q=${encodeURIComponent(
        `SELECT Id, Name, SobjectType FROM RecordType WHERE SobjectType = '${objectName}' AND Name LIKE '${likeNeedle}' LIMIT 100`
      )}`;
      const response = await fetch(recordTypeUrl, { headers });
      if (response.ok) {
        const { records } = await response.json();
        console.log(`Found ${records.length} record types to search`);
        for (const r of records) {
          refs.push({
            id: `recordtype-${r.Id}`,
            fileName: `${r.SobjectType}.${r.Name}.recordType`,
            type: 'Record Type',
            references: [{
              line: 1,
              snippet: `…${fieldName}…`,
              context: 'Standard API: RecordType.Name LIKE'
            }]
          });
        }
      } else {
        console.warn('RecordType standard API query failed:', await response.text());
      }
    } catch (e) {
      console.warn('RecordType LIKE failed', e);
    }
  
    // 9) Page Layouts (Layout.Name LIKE - Metadata field cannot be filtered)
    try {
      const q = `
        SELECT Id, Name, TableEnumOrId
        FROM Layout
        WHERE TableEnumOrId = '${objectName}'
        AND Name LIKE '${likeNeedle}'
        LIMIT 100
      `;
      const { records } = await toolingQuery(q);
      for (const r of records) {
        refs.push({
          id: `layout-${r.Id}`,
          fileName: `${r.TableEnumOrId}.${r.Name}.layout`,
          type: 'Page Layout',
          references: [{
            line: 1,
            snippet: `…${fieldName}…`,
            context: 'Tooling: Layout.Name LIKE'
          }]
        });
      }
    } catch (e) {
      console.warn('Layout LIKE failed', e);
    }
  
    // Deduplicate references by ID to avoid React key conflicts
    const uniqueRefs = refs.reduce((acc, current) => {
      const existingIndex = acc.findIndex(item => item.id === current.id);
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // Merge references if the same item is found multiple times
        acc[existingIndex].references = [
          ...acc[existingIndex].references,
          ...current.references
        ];
      }
      return acc;
    }, [] as MetadataReference[]);
  
    console.log('Total metadata references found:', refs.length);
    console.log('Unique metadata references after deduplication:', uniqueRefs.length);
    return uniqueRefs;
  }
  
  interface CodeSearchResult {
    id: string;
    type: string;
    name: string;
    label: string;
    fileName: string;
    matches: {
      line: number;
      content: string;
      snippet: string;
      context: string;
    }[];
    totalMatches: number;
  }
  
  export async function searchCodeContent(
    instanceUrl: string,
    accessToken: string,
    searchTerm: string
  ): Promise<CodeSearchResult[]> {
    try {
      console.log('Searching code content for:', searchTerm);
      
      // Validate inputs
      if (!instanceUrl || !accessToken || !searchTerm || searchTerm.length < 2) {
        console.log('Invalid search parameters');
        return [];
      }
      
      const cleanInstanceUrl = instanceUrl.replace(/\/$/, '');
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
  
      const results: CodeSearchResult[] = [];
      const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      
      console.log('Starting search with regex:', searchRegex);
  
      // Helper function for tooling queries with timeout and error handling
      const toolingQuery = async (soql: string, timeout = 10000) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const url = `${cleanInstanceUrl}/services/data/${API_VERSION}/tooling/query/?q=${encodeURIComponent(soql)}`;
          console.log('Executing tooling query:', soql);
          
          const response = await fetch(url, { 
            headers, 
            signal: controller.signal 
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.warn('Tooling query failed:', soql, response.status, errorText);
            
            // Handle token expiration
            if (response.status === 401) {
              handleApiError(response, errorText);
            }
            
            return { records: [] };
          }
          
          const result = await response.json();
          console.log(`Query returned ${result.records?.length || 0} records`);
          return result;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.warn('Tooling query timed out:', soql);
          } else if (error instanceof TokenExpiredError) {
            throw error; // Re-throw token errors
          } else {
            console.warn('Tooling query error:', error);
          }
          return { records: [] };
        }
      };
  
  
  
      // Enhanced helper function to search within text content with better visibility
      const searchInContent = (content: string, fileName: string, type: string, name: string, label: string, id: string) => {
        if (!content || content.length === 0) return;
        
        const matches: CodeSearchResult['matches'] = [];
        const lines = content.split('\n');
        const maxMatches = 15; // Increased limit for better visibility
        
        // Use a more efficient search approach
        for (let i = 0; i < lines.length && matches.length < maxMatches; i++) {
          const line = lines[i];
          const lineNumber = i + 1;
          
          if (searchRegex.test(line)) {
            // Create snippet with more context (show more characters before and after)
            const matchIndex = line.toLowerCase().indexOf(searchTerm.toLowerCase());
            const start = Math.max(0, matchIndex - 50); // Increased context
            const end = Math.min(line.length, matchIndex + searchTerm.length + 50); // Increased context
            const snippet = (start > 0 ? '...' : '') + line.substring(start, end).trim() + (end < line.length ? '...' : '');
            
            // Also include surrounding lines for better context
            const contextLines = [];
            if (i > 0 && lines[i - 1].trim()) {
              contextLines.push(`${i}: ${lines[i - 1].trim()}`);
            }
            contextLines.push(`${lineNumber}: ${line.trim()}`);
            if (i < lines.length - 1 && lines[i + 1].trim()) {
              contextLines.push(`${i + 2}: ${lines[i + 1].trim()}`);
            }
            
            matches.push({
              line: lineNumber,
              content: contextLines.join('\n'), // Multi-line content for better context
              snippet,
              context: `Line ${lineNumber} (${type})`
            });
          }
        }
        
        if (matches.length > 0) {
          results.push({
            id,
            type,
            name,
            label,
            fileName,
            matches,
            totalMatches: matches.length
          });
        }
      };
  
      // Run searches in parallel for better performance
      const searchPromises = [];
  
      // 1. Search Apex Classes
      searchPromises.push(
        (async () => {
          try {
            console.log('Searching Apex Classes...');
            const apexClassQuery = `
              SELECT Id, Name, Body, NamespacePrefix
              FROM ApexClass
              ORDER BY LastModifiedDate DESC
              LIMIT 50
            `;
            const { records: apexClasses } = await toolingQuery(apexClassQuery, 8000);
            console.log(`Found ${apexClasses.length} Apex classes to search`);
            
            for (const cls of apexClasses) {
              if (cls.Body && cls.Body.trim() && searchRegex.test(cls.Body)) {
                console.log(`Found matches in Apex class: ${cls.Name}`);
                searchInContent(
                  cls.Body,
                  `${cls.Name}.cls`,
                  'apex-class',
                  cls.Name,
                  cls.Name,
                  `apex-class-${cls.Id}`
                );
              }
            }
          } catch (error) {
            console.warn('Apex class content search failed:', error);
            if (error instanceof TokenExpiredError) {
              throw error;
            }
            // For other errors, continue with other searches
          }
        })()
      );
  
      // 2. Search Apex Triggers
      searchPromises.push(
        (async () => {
          try {
            console.log('Searching Apex Triggers...');
            const triggerQuery = `
              SELECT Id, Name, Body, TableEnumOrId
              FROM ApexTrigger
              ORDER BY LastModifiedDate DESC
              LIMIT 30
            `;
            const { records: triggers } = await toolingQuery(triggerQuery, 6000);
            console.log(`Found ${triggers.length} Apex triggers to search`);
            
            for (const trigger of triggers) {
              if (trigger.Body && trigger.Body.trim() && searchRegex.test(trigger.Body)) {
                console.log(`Found matches in Apex trigger: ${trigger.Name}`);
                searchInContent(
                  trigger.Body,
                  `${trigger.Name}.trigger`,
                  'apex-trigger',
                  trigger.Name,
                  `${trigger.Name} (${trigger.TableEnumOrId})`,
                  `apex-trigger-${trigger.Id}`
                );
              }
            }
          } catch (error) {
            console.warn('Apex trigger content search failed:', error);
            if (error instanceof TokenExpiredError) {
              throw error;
            }
            // For other errors, continue with other searches
          }
        })()
      );
  
      // 3. Search Flows (comprehensive XML metadata search)
      searchPromises.push(
        (async () => {
          try {
            console.log('Searching Flows and their XML metadata...');
            
            // Get all flows using a simple query that works reliably
            const flowQuery = `
              SELECT Id, MasterLabel, Status
              FROM Flow
              WHERE Status = 'Active'
              AND MasterLabel != null
              ORDER BY LastModifiedDate DESC
              LIMIT 50
            `;
            const { records: flows } = await toolingQuery(flowQuery, 15000);
            console.log(`Found ${flows.length} flows for comprehensive search`);
            
            // Process flows in small batches to avoid timeout
            const batchSize = 3;
            for (let i = 0; i < flows.length; i += batchSize) {
              const batch = flows.slice(i, i + batchSize);
              
              await Promise.all(batch.map(async (flow: any) => {
                try {
                  let flowMatches: CodeSearchResult['matches'] = [];
                  let totalMatches = 0;
                  
                  // Search in flow name first
                  if (flow.MasterLabel && searchRegex.test(flow.MasterLabel)) {
                    flowMatches.push({
                      line: 1,
                      content: `Flow Name: ${flow.MasterLabel}`,
                      snippet: flow.MasterLabel,
                      context: 'Flow Name'
                    });
                    totalMatches++;
                  }
                  
                  // Get Flow XML metadata - this is the key part for deep search
                  try {
                    console.log(`Attempting to get XML for flow: ${flow.MasterLabel}`);
                    
                    // Try to get Flow XML using the Tooling API with XML Accept header
                    const flowXmlUrl = `${cleanInstanceUrl}/services/data/${API_VERSION}/tooling/sobjects/Flow/${flow.Id}`;
                    const xmlResponse = await fetch(flowXmlUrl, {
                      headers: {
                        ...headers,
                        'Accept': 'application/xml'
                      }
                    });
                    
                    if (xmlResponse.ok) {
                      const xmlContent = await xmlResponse.text();
                      console.log(`Got XML content for flow ${flow.MasterLabel}, length: ${xmlContent.length}`);
                      
                      if (xmlContent && xmlContent.trim().length > 0 && searchRegex.test(xmlContent)) {
                        console.log(`Found matches in flow XML: ${flow.MasterLabel}`);
                        
                        // Parse XML content line by line for matches
                        const xmlLines = xmlContent.split('\n');
                        const maxXmlMatches = 10;
                        let xmlMatchCount = 0;
                        
                        for (let lineIndex = 0; lineIndex < xmlLines.length && xmlMatchCount < maxXmlMatches; lineIndex++) {
                          const line = xmlLines[lineIndex];
                          const lineNumber = lineIndex + 1;
                          
                          if (searchRegex.test(line)) {
                            const matchIndex = line.toLowerCase().indexOf(searchTerm.toLowerCase());
                            const start = Math.max(0, matchIndex - 60);
                            const end = Math.min(line.length, matchIndex + searchTerm.length + 60);
                            const snippet = (start > 0 ? '...' : '') + line.substring(start, end).trim() + (end < line.length ? '...' : '');
                            
                            // Extract meaningful context from XML tags
                            let context = 'Flow XML';
                            const tagMatch = line.match(/<(\w+)[^>]*>/);
                            if (tagMatch) {
                              const tagName = tagMatch[1];
                              const flowElementTypes: Record<string, string> = {
                                'label': 'Element Label',
                                'name': 'Element Name',
                                'description': 'Element Description',
                                'helpText': 'Help Text',
                                'value': 'Value',
                                'stringValue': 'String Value',
                                'formula': 'Formula',
                                'elementReference': 'Element Reference',
                                'choiceText': 'Choice Text',
                                'defaultValue': 'Default Value',
                                'errorMessage': 'Error Message',
                                'validationRule': 'Validation Rule',
                                'screenField': 'Screen Field',
                                'inputParameter': 'Input Parameter',
                                'outputParameter': 'Output Parameter',
                                'variable': 'Variable',
                                'textTemplate': 'Text Template',
                                'recordLookup': 'Record Lookup',
                                'recordCreate': 'Record Create',
                                'recordUpdate': 'Record Update',
                                'assignment': 'Assignment',
                                'decision': 'Decision',
                                'screen': 'Screen',
                                'subflow': 'Subflow',
                                'loop': 'Loop',
                                'wait': 'Wait',
                                'actionCall': 'Action Call',
                                'collectionProcessor': 'Collection Processor'
                              };
                              
                              context = flowElementTypes[tagName] || `Flow XML (${tagName})`;
                            }
                            
                            // Include surrounding context for better understanding
                            const contextLines = [];
                            if (lineIndex > 0 && xmlLines[lineIndex - 1].trim()) {
                              contextLines.push(`${lineIndex}: ${xmlLines[lineIndex - 1].trim()}`);
                            }
                            contextLines.push(`${lineNumber}: ${line.trim()}`);
                            if (lineIndex < xmlLines.length - 1 && xmlLines[lineIndex + 1].trim()) {
                              contextLines.push(`${lineIndex + 2}: ${xmlLines[lineIndex + 1].trim()}`);
                            }
                            
                            flowMatches.push({
                              line: lineNumber,
                              content: contextLines.join('\n'),
                              snippet,
                              context: `${context} Line ${lineNumber}`
                            });
                            totalMatches++;
                            xmlMatchCount++;
                          }
                        }
                      } else {
                        console.log(`No matches found in XML for flow: ${flow.MasterLabel}`);
                      }
                    } else {
                      console.warn(`Failed to get XML for flow ${flow.MasterLabel}: ${xmlResponse.status} - ${await xmlResponse.text()}`);
                    }
                  } catch (xmlError) {
                    console.warn(`Error getting XML for flow ${flow.MasterLabel}:`, xmlError);
                  }
                  
                  // Add flow to results if we found any matches
                  if (flowMatches.length > 0) {
                    results.push({
                      id: `flow-${flow.Id}`,
                      type: 'flow',
                      name: flow.MasterLabel || 'Flow',
                      label: flow.MasterLabel || 'Flow',
                      fileName: `${flow.MasterLabel || 'Flow'}.flow`,
                      matches: flowMatches,
                      totalMatches
                    });
                  }
                } catch (flowError) {
                  console.warn(`Error processing flow ${flow.MasterLabel}:`, flowError);
                }
              }));
            }
          } catch (error) {
            console.warn('Flow content search failed:', error);
            if (error instanceof TokenExpiredError) {
              throw error;
            }
          }
        })()
      );
  
      // 4. Search Lightning Web Components
      searchPromises.push(
        (async () => {
          try {
            console.log('Searching Lightning Web Components...');
            const lwcQuery = `
              SELECT Id, DeveloperName, MasterLabel, Description
              FROM LightningComponentBundle
              ORDER BY LastModifiedDate DESC
              LIMIT 30
            `;
            const { records: lwcBundles } = await toolingQuery(lwcQuery, 8000);
            console.log(`Found ${lwcBundles.length} LWC bundles to search`);
            
            for (const lwc of lwcBundles) {
              const searchableContent = [
                lwc.DeveloperName,
                lwc.MasterLabel,
                lwc.Description
              ].filter(Boolean).join(' ');
              
              if (searchRegex.test(searchableContent)) {
                console.log(`Found matches in LWC: ${lwc.DeveloperName}`);
                
                const matches = [];
                if (lwc.DeveloperName && searchRegex.test(lwc.DeveloperName)) {
                  matches.push({
                    line: 1,
                    content: `Component Name: ${lwc.DeveloperName}`,
                    snippet: lwc.DeveloperName,
                    context: 'LWC Name'
                  });
                }
                if (lwc.MasterLabel && searchRegex.test(lwc.MasterLabel)) {
                  matches.push({
                    line: 2,
                    content: `Label: ${lwc.MasterLabel}`,
                    snippet: lwc.MasterLabel,
                    context: 'LWC Label'
                  });
                }
                if (lwc.Description && searchRegex.test(lwc.Description)) {
                  matches.push({
                    line: 3,
                    content: `Description: ${lwc.Description}`,
                    snippet: lwc.Description.length > 100 ? lwc.Description.substring(0, 100) + '...' : lwc.Description,
                    context: 'LWC Description'
                  });
                }
                
                results.push({
                  id: `lwc-bundle-${lwc.Id}`,
                  type: 'lwc-bundle',
                  name: lwc.DeveloperName,
                  label: lwc.MasterLabel || lwc.DeveloperName,
                  fileName: `${lwc.DeveloperName}.js`,
                  matches,
                  totalMatches: matches.length
                });
              }
            }
          } catch (error) {
            console.warn('LWC search failed:', error);
            if (error instanceof TokenExpiredError) {
              throw error;
            }
          }
        })()
      );
  
      // 5. Search Aura Components
      searchPromises.push(
        (async () => {
          try {
            console.log('Searching Aura Components...');
            const auraQuery = `
              SELECT Id, DeveloperName, MasterLabel, Description
              FROM AuraDefinitionBundle
              ORDER BY LastModifiedDate DESC
              LIMIT 30
            `;
            const { records: auraBundles } = await toolingQuery(auraQuery, 8000);
            console.log(`Found ${auraBundles.length} Aura bundles to search`);
            
            for (const aura of auraBundles) {
              const searchableContent = [
                aura.DeveloperName,
                aura.MasterLabel,
                aura.Description
              ].filter(Boolean).join(' ');
              
              if (searchRegex.test(searchableContent)) {
                console.log(`Found matches in Aura component: ${aura.DeveloperName}`);
                
                const matches = [];
                if (aura.DeveloperName && searchRegex.test(aura.DeveloperName)) {
                  matches.push({
                    line: 1,
                    content: `Component Name: ${aura.DeveloperName}`,
                    snippet: aura.DeveloperName,
                    context: 'Aura Name'
                  });
                }
                if (aura.MasterLabel && searchRegex.test(aura.MasterLabel)) {
                  matches.push({
                    line: 2,
                    content: `Label: ${aura.MasterLabel}`,
                    snippet: aura.MasterLabel,
                    context: 'Aura Label'
                  });
                }
                if (aura.Description && searchRegex.test(aura.Description)) {
                  matches.push({
                    line: 3,
                    content: `Description: ${aura.Description}`,
                    snippet: aura.Description.length > 100 ? aura.Description.substring(0, 100) + '...' : aura.Description,
                    context: 'Aura Description'
                  });
                }
                
                results.push({
                  id: `aura-bundle-${aura.Id}`,
                  type: 'aura-bundle',
                  name: aura.DeveloperName,
                  label: aura.MasterLabel || aura.DeveloperName,
                  fileName: `${aura.DeveloperName}.cmp`,
                  matches,
                  totalMatches: matches.length
                });
              }
            }
          } catch (error) {
            console.warn('Aura component search failed:', error);
            if (error instanceof TokenExpiredError) {
              throw error;
            }
          }
        })()
      );
  
      // 6. Search Validation Rules and other metadata
      searchPromises.push(
        (async () => {
          try {
            console.log('Searching Validation Rules...');
            const validationQuery = `
              SELECT Id, ValidationName, ErrorMessage, ErrorDisplayField, Active
              FROM ValidationRule
              ORDER BY LastModifiedDate DESC
              LIMIT 30
            `;
            const { records: validationRules } = await toolingQuery(validationQuery, 6000);
            console.log(`Found ${validationRules.length} validation rules to search`);
            
            for (const rule of validationRules) {
              const searchableContent = [
                rule.ValidationName,
                rule.ErrorMessage,
                rule.ErrorDisplayField
              ].filter(Boolean).join(' ');
              
              if (searchRegex.test(searchableContent)) {
                console.log(`Found matches in validation rule: ${rule.ValidationName}`);
                
                const matches = [];
                if (rule.ValidationName && searchRegex.test(rule.ValidationName)) {
                  matches.push({
                    line: 1,
                    content: `Rule Name: ${rule.ValidationName}`,
                    snippet: rule.ValidationName,
                    context: 'Validation Rule Name'
                  });
                }
                if (rule.ErrorMessage && searchRegex.test(rule.ErrorMessage)) {
                  matches.push({
                    line: 2,
                    content: `Error Message: ${rule.ErrorMessage}`,
                    snippet: rule.ErrorMessage.length > 100 ? rule.ErrorMessage.substring(0, 100) + '...' : rule.ErrorMessage,
                    context: 'Error Message'
                  });
                }
                
                results.push({
                  id: `validation-rule-${rule.Id}`,
                  type: 'validation-rule',
                  name: rule.ValidationName,
                  label: rule.ValidationName,
                  fileName: `${rule.ValidationName}.validationRule`,
                  matches,
                  totalMatches: matches.length
                });
              }
            }
          } catch (error) {
            console.warn('Validation rule search failed:', error);
            if (error instanceof TokenExpiredError) {
              throw error;
            }
          }
        })()
      );
  
      // 7. Search Page Layouts
      searchPromises.push(
        (async () => {
          try {
            console.log('Searching Page Layouts...');
            const layoutQuery = `
              SELECT Id, Name, TableEnumOrId
              FROM Layout
              ORDER BY LastModifiedDate DESC
              LIMIT 30
            `;
            const { records: layouts } = await toolingQuery(layoutQuery, 6000);
            console.log(`Found ${layouts.length} page layouts to search`);
            
            for (const layout of layouts) {
              if (layout.Name && searchRegex.test(layout.Name)) {
                console.log(`Found matches in page layout: ${layout.Name}`);
                
                results.push({
                  id: `page-layout-${layout.Id}`,
                  type: 'page-layout',
                  name: layout.Name,
                  label: `${layout.Name} (${layout.TableEnumOrId})`,
                  fileName: `${layout.TableEnumOrId}.${layout.Name}.layout`,
                  matches: [{
                    line: 1,
                    content: `Layout Name: ${layout.Name}`,
                    snippet: layout.Name,
                    context: 'Page Layout Name'
                  }],
                  totalMatches: 1
                });
              }
            }
          } catch (error) {
            console.warn('Page layout search failed:', error);
            if (error instanceof TokenExpiredError) {
              throw error;
            }
          }
        })()
      );
  
      // 8. Search Record Types
      searchPromises.push(
        (async () => {
          try {
            console.log('Searching Record Types...');
            // Use standard REST API for RecordType as Tooling API has field limitations
            const recordTypeUrl = `${cleanInstanceUrl}/services/data/${API_VERSION}/query/?q=${encodeURIComponent(
              'SELECT Id, Name, SobjectType, Description FROM RecordType ORDER BY LastModifiedDate DESC LIMIT 30'
            )}`;
            const recordTypeResponse = await fetch(recordTypeUrl, { headers });
            if (!recordTypeResponse.ok) {
              console.warn('RecordType query failed:', await recordTypeResponse.text());
              return;
            }
            const { records: recordTypes } = await recordTypeResponse.json();
            console.log(`Found ${recordTypes.length} record types to search`);
            
            for (const recordType of recordTypes) {
              const searchableContent = [
                recordType.Name,
                recordType.Description
              ].filter(Boolean).join(' ');
              
              if (searchRegex.test(searchableContent)) {
                console.log(`Found matches in record type: ${recordType.Name}`);
                
                const matches = [];
                if (recordType.Name && searchRegex.test(recordType.Name)) {
                  matches.push({
                    line: 1,
                    content: `Record Type Name: ${recordType.Name}`,
                    snippet: recordType.Name,
                    context: 'Record Type Name'
                  });
                }
                if (recordType.Description && searchRegex.test(recordType.Description)) {
                  matches.push({
                    line: 2,
                    content: `Description: ${recordType.Description}`,
                    snippet: recordType.Description.length > 100 ? recordType.Description.substring(0, 100) + '...' : recordType.Description,
                    context: 'Record Type Description'
                  });
                }
                
                results.push({
                  id: `record-type-${recordType.Id}`,
                  type: 'record-type',
                  name: recordType.Name,
                  label: `${recordType.Name} (${recordType.SobjectType})`,
                  fileName: `${recordType.SobjectType}.${recordType.Name}.recordType`,
                  matches,
                  totalMatches: matches.length
                });
              }
            }
          } catch (error) {
            console.warn('Record type search failed:', error);
            if (error instanceof TokenExpiredError) {
              throw error;
            }
          }
        })()
      );
  
  
  
      // 10. Search using SOSL for broader compatibility (fallback with proper escaping)
      searchPromises.push(
        (async () => {
          try {
            console.log('Searching using SOSL fallback...');
            // Use SOSL to search across multiple object types as fallback with proper escaping
            const searchUrl = buildSearchUrl(cleanInstanceUrl, searchTerm, ['ApexClass', 'ApexTrigger']);
            
            const response = await fetch(searchUrl, { headers });
            if (response.ok) {
              const data = await response.json();
              console.log(`SOSL fallback returned ${data.searchRecords?.length || 0} records`);
              
              if (Array.isArray(data.searchRecords)) {
                for (const record of data.searchRecords) {
                  const type = record?.attributes?.type;
                  const existingId = type === 'ApexClass' ? `apex-class-${record.Id}` : `apex-trigger-${record.Id}`;
                  
                  // Only add if we don't already have this result from detailed search
                  if (!results.find(r => r.id === existingId)) {
                    if (type === 'ApexClass') {
                      results.push({
                        id: existingId,
                        type: 'apex-class',
                        name: record.Name,
                        label: record.Name,
                        fileName: `${record.Name}.cls`,
                        matches: [{
                          line: 1,
                          content: `Found via SOSL search - contains "${searchTerm}"`,
                          snippet: `Contains "${searchTerm}"`,
                          context: 'SOSL Search Result'
                        }],
                        totalMatches: 1
                      });
                    } else if (type === 'ApexTrigger') {
                      results.push({
                        id: existingId,
                        type: 'apex-trigger',
                        name: record.Name,
                        label: record.Name,
                        fileName: `${record.Name}.trigger`,
                        matches: [{
                          line: 1,
                          content: `Found via SOSL search - contains "${searchTerm}"`,
                          snippet: `Contains "${searchTerm}"`,
                          context: 'SOSL Search Result'
                        }],
                        totalMatches: 1
                      });
                    }
                  }
                }
              }
            } else {
              const errorText = await response.text();
              console.warn('SOSL fallback search failed:', errorText);
              
              // Check if it's a malformed search error and provide helpful info
              if (errorText.includes('MALFORMED_SEARCH') || errorText.includes('mismatched character')) {
                console.warn('SOSL search term contains reserved characters. Search term:', searchTerm);
                console.warn('Escaped search term would be:', escapeSOSL(searchTerm));
              }
            }
          } catch (error) {
            console.warn('SOSL fallback search failed:', error);
            if (error instanceof TokenExpiredError) {
              throw error;
            }
            // For other errors, continue with other searches
          }
        })()
      );
  
  
  
      // Wait for all searches to complete with a timeout
      console.log('Waiting for all search promises to complete...');
      const searchResults = await Promise.allSettled(searchPromises);
      
      // Log results of each search
      searchResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Search promise ${index} rejected:`, result.reason);
          if (result.reason instanceof TokenExpiredError) {
            throw result.reason;
          }
        }
      });
  
      // Deduplicate results by name and type (especially important for Flows)
      const uniqueResults = results.reduce((acc, current) => {
        const key = `${current.type}-${current.name}`;
        const existingIndex = acc.findIndex(item => `${item.type}-${item.name}` === key);
        
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Merge matches from duplicate entries
          const existing = acc[existingIndex];
          const combinedMatches = [...existing.matches, ...current.matches];
          
          // Remove duplicate matches based on line number and content
          const uniqueMatches = combinedMatches.reduce((matchAcc, match) => {
            const matchKey = `${match.line}-${match.snippet}`;
            if (!matchAcc.find(m => `${m.line}-${m.snippet}` === matchKey)) {
              matchAcc.push(match);
            }
            return matchAcc;
          }, [] as CodeSearchResult['matches']);
          
          acc[existingIndex] = {
            ...existing,
            matches: uniqueMatches,
            totalMatches: uniqueMatches.length
          };
        }
        return acc;
      }, [] as CodeSearchResult[]);
      
      // Sort results by relevance (total matches and recency)
      uniqueResults.sort((a, b) => {
        // Primary sort: total matches
        const matchDiff = (b.totalMatches || 0) - (a.totalMatches || 0);
        if (matchDiff !== 0) return matchDiff;
        
        // Secondary sort: alphabetical by name
        return a.name.localeCompare(b.name);
      });
      
      console.log(`Found ${uniqueResults.length} unique files with matches for "${searchTerm}"`);
      console.log(`Total matches across all files: ${uniqueResults.reduce((sum, r) => sum + (r.totalMatches || 0), 0)}`);
      
      // Log breakdown by type for debugging
      const typeBreakdown = uniqueResults.reduce((acc, result) => {
        acc[result.type] = (acc[result.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Search results by type:', typeBreakdown);
      
      return uniqueResults.slice(0, 50); // Limit results for better performance
      
    } catch (error) {
      console.error('Code content search error:', error);
      return [];
    }
  }
  
  export async function searchSalesforce(
    instanceUrl: string,
    accessToken: string,
    query: string
  ): Promise<any[]> {
    // Use the new code content search instead of the old metadata search
    return searchCodeContent(instanceUrl, accessToken, query);
  }