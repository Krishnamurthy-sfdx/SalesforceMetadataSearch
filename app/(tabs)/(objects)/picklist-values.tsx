import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { List } from "lucide-react-native";
import type { SalesforceField } from "@/types/salesforce";

type PicklistValue = NonNullable<SalesforceField['picklistValues']>[0];

export default function PicklistValuesScreen() {
  const { 
    fieldLabel, 
    fieldName, 
    fieldType, 
    picklistValues 
  } = useLocalSearchParams<{
    fieldLabel: string;
    fieldName: string;
    fieldType: string;
    picklistValues: string;
  }>();

  const values: PicklistValue[] = picklistValues ? JSON.parse(picklistValues) : [];

  const renderPicklistValue = ({ item, index }: { item: PicklistValue; index: number }) => (
    <View style={styles.valueCard}>
      <View style={styles.valueHeader}>
        <View style={styles.valueIcon}>
          <List size={16} color="#0176D3" />
        </View>
        <View style={styles.valueInfo}>
          <Text style={styles.valueLabel}>{item.label}</Text>
          {item.value !== item.label && (
            <Text style={styles.valueCode}>{item.value}</Text>
          )}
          <View style={styles.valueMeta}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>#{index + 1}</Text>
            </View>
            {item.active !== undefined && (
              <View style={item.active ? styles.activeBadge : styles.inactiveBadge}>
                <Text style={item.active ? styles.activeText : styles.inactiveText}>
                  {item.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            )}

          </View>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `${fieldLabel} Values`,
          headerStyle: {
            backgroundColor: "#0176D3",
          },
          headerTintColor: "#FFFFFF",
        }} 
      />
      <View style={styles.container}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabelText}>{fieldLabel}</Text>
          <Text style={styles.fieldNameText}>{fieldName}</Text>
          <View style={styles.fieldTypeBadge}>
            <Text style={styles.fieldTypeText}>{fieldType}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{values.length} values</Text>
          </View>
        </View>

        <FlatList
          data={values}
          renderItem={renderPicklistValue}
          keyExtractor={(item, index) => `${item.value}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No picklist values found</Text>
            </View>
          }
        />
      </View>
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
    marginBottom: 12,
  },
  fieldTypeText: {
    fontSize: 14,
    color: "#1565C0",
    fontWeight: "700",
  },
  countBadge: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  countText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "700",
  },
  valueMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  valueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
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
  valueHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  valueIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
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
  valueCode: {
    fontSize: 13,
    color: "#5F6368",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  indexBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  indexText: {
    fontSize: 11,
    color: "#1565C0",
    fontWeight: "700",
  },
  activeBadge: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  activeText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "700",
  },
  inactiveBadge: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  inactiveText: {
    fontSize: 11,
    color: "#C62828",
    fontWeight: "700",
  },
  defaultBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCC02",
  },
  defaultText: {
    fontSize: 11,
    color: "#E65100",
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#5F6368",
    fontWeight: "500",
  },
});