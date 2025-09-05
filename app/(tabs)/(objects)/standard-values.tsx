import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { List, Info } from "lucide-react-native";
import { getStandardFieldValues, getStandardValueSetName } from "@/constants/standard-field-values";
import type { StandardFieldValue } from "@/constants/standard-field-values";

export default function StandardValuesScreen() {
  const { objectName, fieldName, fieldLabel } = useLocalSearchParams<{
    objectName: string;
    fieldName: string;
    fieldLabel: string;
  }>();

  const standardValues = getStandardFieldValues(objectName, fieldName);
  const standardValueSetName = getStandardValueSetName(objectName, fieldName);

  const renderStandardValue = (value: StandardFieldValue, index: number) => (
    <View key={index} style={styles.valueCard}>
      <View style={styles.valueHeader}>
        <View style={styles.valueIcon}>
          <List size={16} color="#1565C0" />
        </View>
        <View style={styles.valueInfo}>
          <Text style={styles.valueLabel}>{value.label}</Text>
          <Text style={styles.valueApiName}>{value.value}</Text>
          {value.description && (
            <View style={styles.descriptionContainer}>
              <Info size={12} color="#5F6368" />
              <Text style={styles.valueDescription}>{value.description}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `${fieldLabel} - Standard Values`,
          headerTitleStyle: { fontSize: 16 }
        }} 
      />
      <ScrollView style={styles.container}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabelText}>{fieldLabel}</Text>
          <Text style={styles.fieldNameText}>{fieldName}</Text>
          <View style={styles.objectBadge}>
            <Text style={styles.objectText}>{objectName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Standard Values</Text>
          <Text style={styles.sectionSubtitle}>
            Default picklist values provided by Salesforce
          </Text>
          {standardValueSetName && (
            <View style={styles.standardValueSetBadge}>
              <Text style={styles.standardValueSetText}>
                StandardValueSet: {standardValueSetName}
              </Text>
            </View>
          )}
        </View>

        {standardValueSetName ? (
          <View style={styles.standardValueSetContainer}>
            <View style={styles.standardValueSetCard}>
              <View style={styles.standardValueSetHeader}>
                <View style={styles.standardValueSetIcon}>
                  <List size={20} color="#1565C0" />
                </View>
                <View style={styles.standardValueSetInfo}>
                  <Text style={styles.standardValueSetTitle}>StandardValueSet</Text>
                  <Text style={styles.standardValueSetName}>{standardValueSetName}</Text>
                  <Text style={styles.standardValueSetDescription}>
                    This field uses a predefined Salesforce StandardValueSet with standard picklist values.
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>About StandardValueSets</Text>
              <Text style={styles.infoText}>
                StandardValueSets are predefined by Salesforce and contain common picklist values that are shared across multiple objects and fields. They ensure consistency and reduce maintenance overhead.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No standard values available</Text>
            <Text style={styles.emptySubtext}>
              This field doesn't have predefined standard values
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
    fontSize: 24,
    fontWeight: "700",
    color: "#202124",
    marginBottom: 8,
    lineHeight: 32,
  },
  fieldNameText: {
    fontSize: 14,
    color: "#5F6368",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  objectBadge: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  objectText: {
    fontSize: 12,
    color: "#1565C0",
    fontWeight: "600",
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
  valuesList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  valueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F3F4",
    overflow: "hidden",
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
  valueHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  valueIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  valueInfo: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202124",
    marginBottom: 4,
    lineHeight: 22,
  },
  valueApiName: {
    fontSize: 13,
    color: "#5F6368",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  valueDescription: {
    fontSize: 13,
    color: "#5F6368",
    fontWeight: "500",
    lineHeight: 18,
    flex: 1,
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
  standardValueSetBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  standardValueSetText: {
    fontSize: 12,
    color: "#E65100",
    fontWeight: "600",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  standardValueSetContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  standardValueSetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E3F2FD",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#1565C0",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  standardValueSetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 24,
  },
  standardValueSetIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  standardValueSetInfo: {
    flex: 1,
  },
  standardValueSetTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5F6368",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  standardValueSetName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1565C0",
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  standardValueSetDescription: {
    fontSize: 14,
    color: "#5F6368",
    lineHeight: 20,
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202124",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#5F6368",
    lineHeight: 20,
    fontWeight: "500",
  },
});