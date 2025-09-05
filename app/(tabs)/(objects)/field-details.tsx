import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { FileCode, Code, FileText, ChevronRight, List, ExternalLink } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { fetchFieldMetadata } from "@/services/salesforce";
import type { MetadataReference } from "@/types/salesforce";
import { hasStandardValues } from "@/constants/standard-field-values";

export default function FieldDetailsScreen() {
  const { objectName, fieldName, fieldLabel, fieldType } = useLocalSearchParams<{
    objectName: string;
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
  }>();

  const { accessToken, instanceUrl } = useAuth();

  const hasStandardFieldValues = hasStandardValues(objectName, fieldName);

  const { data: metadata = [], isLoading, error } = useQuery({
    queryKey: ["field-metadata", objectName, fieldName, instanceUrl, accessToken],
    queryFn: () => fetchFieldMetadata(instanceUrl!, accessToken!, objectName, fieldName),
    enabled: !!accessToken && !!instanceUrl && !!objectName && !!fieldName,
  });

  const getFileIcon = (type: string) => {
    if (type.includes("apex") || type.includes("class")) {
      return <FileCode size={20} color="#0176D3" />;
    }
    if (type.includes("trigger") || type.includes("flow")) {
      return <Code size={20} color="#0176D3" />;
    }
    return <FileText size={20} color="#0176D3" />;
  };

  const renderMetadataItem = (item: MetadataReference) => {
    const navigateToReference = () => {
      router.push({
        pathname: "/(tabs)/(objects)/metadata-reference",
        params: {
          fileName: item.fileName,
          fileType: item.type,
          references: JSON.stringify(item.references),
          fieldLabel: fieldLabel || fieldName,
        },
      });
    };

    // Truncate long file names for better display
    const displayFileName = item.fileName.length > 35 
      ? item.fileName.substring(0, 35) + '...' 
      : item.fileName;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.metadataCard}
        onPress={navigateToReference}
        activeOpacity={0.7}
      >
        <View style={styles.fileIcon}>
          {getFileIcon(item.type)}
        </View>
        <View style={styles.metadataInfo}>
          <Text style={styles.fileName} numberOfLines={1}>{displayFileName}</Text>
          <View style={styles.metadataRow}>
            <Text style={styles.fileType}>{item.type}</Text>
            <View style={styles.referencesCountBadge}>
              <Text style={styles.referencesCount}>
                {item.references.length}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={18} color="#5F6368" />
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load metadata</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabelText}>{fieldLabel}</Text>
        <Text style={styles.fieldNameText}>{fieldName}</Text>
        <View style={styles.fieldTypeBadge}>
          <Text style={styles.fieldTypeText}>{fieldType}</Text>
        </View>
      </View>

      {hasStandardFieldValues && (
        <View style={styles.standardValuesSection}>
          <TouchableOpacity
            style={styles.standardValuesButton}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/(objects)/standard-values",
                params: {
                  objectName,
                  fieldName,
                  fieldLabel: fieldLabel || fieldName,
                },
              });
            }}
            activeOpacity={0.7}
          >
            <View style={styles.standardValuesContent}>
              <View style={styles.standardValuesIcon}>
                <List size={20} color="#1565C0" />
              </View>
              <View style={styles.standardValuesInfo}>
                <Text style={styles.standardValuesTitle}>View Standard Values</Text>
                <Text style={styles.standardValuesSubtitle}>
                  See default picklist values for this field
                </Text>
              </View>
              <ExternalLink size={20} color="#1565C0" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metadata References</Text>
        <Text style={styles.sectionSubtitle}>
          Files where this field is referenced
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0176D3" />
          <Text style={styles.loadingText}>Scanning metadata...</Text>
        </View>
      ) : metadata.length > 0 ? (
        <View style={styles.metadataList}>
          {metadata.map(renderMetadataItem)}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No metadata references found</Text>
          <Text style={styles.emptySubtext}>
            This field is not referenced in any metadata files
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  fieldHeader: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fieldLabelText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#202124",
    marginBottom: 8,
    lineHeight: 36,
  },
  fieldNameText: {
    fontSize: 16,
    color: "#5F6368",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 16,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  fieldTypeBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  fieldTypeText: {
    fontSize: 14,
    color: "#1565C0",
    fontWeight: "700",
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#202124",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#5F6368",
    fontWeight: "500",
  },
  metadataList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  metadataCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F3F4",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  metadataInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#202124",
    marginBottom: 6,
    lineHeight: 20,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fileType: {
    fontSize: 12,
    color: "#5F6368",
    fontWeight: "500",
    flex: 1,
  },
  referencesCountBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  referencesCount: {
    fontSize: 11,
    color: "#1565C0",
    fontWeight: "700",
  },

  loadingContainer: {
    alignItems: "center",
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#5F6368",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#EA4335",
    textAlign: "center",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    color: "#5F6368",
    marginBottom: 8,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#5F6368",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 20,
  },
  standardValuesSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F3F4",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  standardValuesButton: {
    backgroundColor: "#E8F0FE",
  },
  standardValuesContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  standardValuesIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  standardValuesInfo: {
    flex: 1,
  },
  standardValuesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1565C0",
    marginBottom: 4,
    lineHeight: 22,
  },
  standardValuesSubtitle: {
    fontSize: 13,
    color: "#5F6368",
    fontWeight: "500",
    lineHeight: 18,
  },
});