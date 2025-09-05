import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { FileCode, Code, FileText } from "lucide-react-native";
import type { MetadataReference } from "@/types/salesforce";

export default function MetadataReferenceScreen() {
  const { 
    fileName, 
    fileType, 
    references, 
    fieldLabel 
  } = useLocalSearchParams<{
    fileName: string;
    fileType: string;
    references: string;
    fieldLabel: string;
  }>();

  let parsedReferences: any[] = [];
  try {
    parsedReferences = references ? JSON.parse(references) : [];
  } catch (error) {
    console.error('Error parsing references JSON:', error);
    console.error('References value:', references);
    parsedReferences = [];
  }

  const getFileIcon = (type: string) => {
    if (type.includes("apex") || type.includes("class")) {
      return <FileCode size={24} color="#0176D3" />;
    }
    if (type.includes("trigger") || type.includes("flow")) {
      return <Code size={24} color="#0176D3" />;
    }
    return <FileText size={24} color="#0176D3" />;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.fileIconContainer}>
          {getFileIcon(fileType)}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.fileName}>{fileName}</Text>
          <Text style={styles.fileType}>{fileType}</Text>
          <Text style={styles.fieldReference}>References: {fieldLabel}</Text>
        </View>
      </View>

      <View style={styles.referencesSection}>
        <Text style={styles.sectionTitle}>
          {parsedReferences.length} Reference{parsedReferences.length !== 1 ? 's' : ''}
        </Text>
        
        {parsedReferences.map((ref: any, index: number) => {
          // Truncate long snippets for better readability
          const truncatedSnippet = ref.snippet && ref.snippet.length > 120 
            ? ref.snippet.substring(0, 120) + '...' 
            : ref.snippet;
          
          const truncatedContext = ref.context && ref.context.length > 80
            ? ref.context.substring(0, 80) + '...'
            : ref.context;

          return (
            <View key={index} style={styles.referenceCard}>
              <View style={styles.referenceHeader}>
                <View style={styles.lineNumberBadge}>
                  <Text style={styles.lineNumberText}>L{ref.line}</Text>
                </View>
                {ref.context && (
                  <Text style={styles.contextChip} numberOfLines={1}>
                    {truncatedContext}
                  </Text>
                )}
              </View>
              
              <View style={styles.codeContainer}>
                <Text style={styles.codeText} numberOfLines={3}>
                  {truncatedSnippet}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  fileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  headerInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#202124",
    marginBottom: 4,
  },
  fileType: {
    fontSize: 14,
    color: "#5F6368",
    marginBottom: 8,
    fontWeight: "500",
  },
  fieldReference: {
    fontSize: 12,
    color: "#1565C0",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    fontWeight: "600",
  },
  referencesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202124",
    marginBottom: 16,
  },
  referenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8EAED",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  referenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
  },
  lineNumberBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  lineNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1565C0",
  },
  contextChip: {
    flex: 1,
    fontSize: 12,
    color: "#5F6368",
    fontStyle: "italic",
    fontWeight: "500",
  },
  codeContainer: {
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  codeText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: "#202124",
    lineHeight: 18,
  },
});