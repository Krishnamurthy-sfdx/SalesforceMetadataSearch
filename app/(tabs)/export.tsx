import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Download, FileText, CheckCircle2, Circle, DownloadCloud } from 'lucide-react-native';
import { useAuth } from '@/providers/auth-provider';
import { fetchSalesforceObjects, fetchObjectFields } from '@/services/salesforce';
import type { SalesforceObject, SalesforceField } from '@/types/salesforce';

interface ExportData {
  fieldName: string;
  fieldLabel: string;
  dataType: string;
  length: number;
  required: boolean;
  unique: boolean;
  custom: boolean;
  nillable: boolean;
  referenceTo: string;
  relationshipName: string;
  childRelationships: string;
  restrictedPicklist: boolean;
  cascadeDelete: boolean;
  picklistValues: string;
}

export default function ExportScreen() {
  const { isAuthenticated, instanceUrl, accessToken } = useAuth();
  const [objects, setObjects] = useState<SalesforceObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated && instanceUrl && accessToken) {
      loadObjects();
    }
  }, [isAuthenticated, instanceUrl, accessToken]);

  const loadObjects = async () => {
    if (!instanceUrl || !accessToken) return;
    
    setLoading(true);
    try {
      console.log('Loading objects for export...');
      const objectsData = await fetchSalesforceObjects(instanceUrl, accessToken);
      setObjects(objectsData);
      console.log('Objects loaded:', objectsData.length);
    } catch (error) {
      console.error('Error loading objects:', error);
      Alert.alert('Error', 'Failed to load objects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = (data: ExportData[]): string => {
    const headers = [
      'Field Name',
      'Field Label', 
      'Data Type',
      'Length',
      'Required',
      'Unique',
      'Custom',
      'Nillable',
      'Reference To',
      'Relationship Name',
      'Child Relationships',
      'Restricted Picklist',
      'Cascade Delete',
      'Picklist Values'
    ];

    const csvContent = [headers.join(',')];
    
    data.forEach(row => {
      const csvRow = [
        `"${row.fieldName}"`,
        `"${row.fieldLabel}"`,
        `"${row.dataType}"`,
        row.length.toString(),
        row.required.toString(),
        row.unique.toString(),
        row.custom.toString(),
        row.nillable.toString(),
        `"${row.referenceTo}"`,
        `"${row.relationshipName}"`,
        `"${row.childRelationships}"`,
        row.restrictedPicklist.toString(),
        row.cascadeDelete.toString(),
        `"${row.picklistValues}"`
      ];
      csvContent.push(csvRow.join(','));
    });

    return csvContent.join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    if (Platform.OS === 'web') {
      // Web download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Mobile - show alert with CSV content (since we can't directly download files)
      Alert.alert(
        'Export Complete',
        'CSV data has been generated. On mobile, you can copy this data and save it manually.',
        [
          {
            text: 'Copy to Clipboard',
            onPress: () => {
              // Note: In a real app, you'd use expo-clipboard here
              console.log('CSV Content:', csvContent);
              Alert.alert('Info', 'CSV content logged to console. In a production app, this would be copied to clipboard.');
            }
          },
          { text: 'OK' }
        ]
      );
    }
  };

  const handleExport = async () => {
    if (!selectedObject || !instanceUrl || !accessToken) {
      Alert.alert('Error', 'Please select an object to export.');
      return;
    }

    setExporting(true);
    try {
      console.log('Exporting object:', selectedObject);
      const fields = await fetchObjectFields(instanceUrl, accessToken, selectedObject);
      
      const exportData: ExportData[] = fields.map((field: SalesforceField) => ({
        fieldName: field.name,
        fieldLabel: field.label,
        dataType: field.type,
        length: field.length || 0,
        required: field.required,
        unique: field.unique || false,
        custom: field.custom,
        nillable: field.nillable || false,
        referenceTo: field.referenceTo?.join(', ') || '',
        relationshipName: field.relationshipName || '',
        childRelationships: field.childRelationships?.map(rel => 
          `${rel.childSObject}.${rel.field} (${rel.relationshipName})`
        ).join('; ') || '',
        restrictedPicklist: field.restrictedPicklist || false,
        cascadeDelete: field.cascadeDelete || false,
        picklistValues: field.picklistValues?.map(pv => 
          `${pv.label} (${pv.value})${pv.active ? '' : ' [Inactive]'}`
        ).join('; ') || ''
      }));

      const csvContent = generateCSV(exportData);
      const filename = `${selectedObject}_fields_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadCSV(csvContent, filename);
      
      Alert.alert('Success', `Exported ${fields.length} fields for ${selectedObject}`);
      
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export object fields. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const filteredObjects = objects.filter(obj => 
    obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Export' }} />
        <View style={styles.centerContent}>
          <FileText size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Authentication Required</Text>
          <Text style={styles.emptyText}>
            Please configure your Salesforce connection in Settings to export object metadata.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Export Object Fields</Text>
        <Text style={styles.subtitle}>
          Select an object to export all its field metadata as a CSV file
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0176D3" />
          <Text style={styles.loadingText}>Loading objects...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.objectsList}>
            {filteredObjects.map((object) => (
              <TouchableOpacity
                key={object.name}
                style={[
                  styles.objectItem,
                  selectedObject === object.name && styles.selectedObjectItem
                ]}
                onPress={() => setSelectedObject(object.name)}
                testID={`object-${object.name}`}
                activeOpacity={0.7}
              >
                <View style={styles.radioContainer}>
                  {selectedObject === object.name ? (
                    <CheckCircle2 size={20} color="#1B96FF" />
                  ) : (
                    <Circle size={20} color="#C7CCD1" />
                  )}
                </View>
                <View style={styles.objectDetails}>
                  <Text style={styles.objectName}>{object.label}</Text>
                  <Text style={styles.objectApiName}>{object.name}</Text>
                </View>
                {object.custom && (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>Custom</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.exportButton,
            (!selectedObject || exporting) && styles.exportButtonDisabled
          ]}
          onPress={handleExport}
          disabled={!selectedObject || exporting}
          testID="export-button"
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <DownloadCloud size={22} color="#FFFFFF" />
          )}
          <Text style={styles.exportButtonText}>
            {exporting ? 'Exporting...' : 'Export to CSV'}
          </Text>
        </TouchableOpacity>
        
        {selectedObject && (
          <Text style={styles.selectedInfo}>
            Selected: {objects.find(obj => obj.name === selectedObject)?.label}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  header: {
    backgroundColor: "#1B96FF",
    padding: 24,
    paddingTop: 64,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: "#FFFFFF",
    opacity: 0.9,
    fontWeight: "500",
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16325C',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 17,
    color: '#747474',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#747474',
    marginTop: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  objectsList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F3F4',
  },
  objectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  selectedObjectItem: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#1B96FF',
  },
  radioContainer: {
    marginRight: 16,
  },
  objectDetails: {
    flex: 1,
  },
  objectName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16325C',
    marginBottom: 4,
    lineHeight: 22,
  },
  objectApiName: {
    fontSize: 13,
    color: '#747474',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#F7F9FB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  customBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  customBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exportButton: {
    backgroundColor: '#1B96FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#1B96FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButtonDisabled: {
    backgroundColor: '#C7CCD1',
    shadowOpacity: 0,
    elevation: 0,
  },
  exportButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  selectedInfo: {
    fontSize: 15,
    color: '#747474',
    textAlign: 'center',
    fontWeight: '500',
  },
});