import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { ChevronRight, Type, Hash, Calendar, ToggleLeft, Filter, Link, List, ExternalLink, Star, ChevronDown, ChevronUp } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { fetchObjectFields } from "@/services/salesforce";
import type { SalesforceField } from "@/types/salesforce";
import { hasStandardValues, getStandardValueSetName } from "@/constants/standard-field-values";

interface FilterState {
  required: boolean;
  unique: boolean;
  lookup: boolean;
  picklist: boolean;
  masterDetail: boolean;
  fieldType: 'all' | 'standard' | 'custom';
}

export default function ObjectFieldsScreen() {
  const { objectName } = useLocalSearchParams<{ objectName: string }>();
  const displayName = Array.isArray(objectName) ? objectName[0] : objectName || "Object";
  const headerTitle = displayName;
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllFilters, setShowAllFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    required: false,
    unique: false,
    lookup: false,
    picklist: false,
    masterDetail: false,
    fieldType: 'all',
  });
  const { accessToken, instanceUrl } = useAuth();

  const { data: fields = [], isLoading, error, refetch } = useQuery({
    queryKey: ["salesforce-fields", displayName, instanceUrl, accessToken],
    queryFn: () => fetchObjectFields(instanceUrl!, accessToken!, displayName),
    enabled: !!accessToken && !!instanceUrl && !!objectName,
  });

  const filteredFields = useMemo(() => {
    let filtered = fields;
    
    if (searchQuery) {
      filtered = filtered.filter(field => 
        field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.required) {
      filtered = filtered.filter(field => field.required);
    }

    if (filters.unique) {
      filtered = filtered.filter(field => field.unique);
    }

    if (filters.lookup) {
      filtered = filtered.filter(field => 
        field.referenceTo && field.referenceTo.length > 0
      );
    }

    if (filters.picklist) {
      filtered = filtered.filter(field => 
        field.type.toLowerCase() === 'picklist' || 
        field.type.toLowerCase() === 'multipicklist'
      );
    }

    if (filters.masterDetail) {
      filtered = filtered.filter(field => {
        const isLookup = field.referenceTo && field.referenceTo.length > 0;
        return isLookup && !field.nillable && field.cascadeDelete;
      });
    }

    if (filters.fieldType === 'custom') {
      filtered = filtered.filter(field => field.custom);
    } else if (filters.fieldType === 'standard') {
      filtered = filtered.filter(field => !field.custom);
    }
    
    return filtered.sort((a, b) => a.label.localeCompare(b.label));
  }, [fields, searchQuery, filters]);

  const toggleFilter = (filterKey: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const setFieldTypeFilter = (fieldType: 'all' | 'standard' | 'custom') => {
    setFilters(prev => ({
      ...prev,
      fieldType
    }));
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key === 'fieldType' ? value !== 'all' : Boolean(value)
  );

  const clearAllFilters = () => {
    setFilters({
      required: false,
      unique: false,
      lookup: false,
      picklist: false,
      masterDetail: false,
      fieldType: 'all',
    });
  };

  const getFieldIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "string":
      case "textarea":
      case "picklist":
        return <Type size={16} color="#0176D3" />;
      case "double":
      case "currency":
      case "percent":
      case "int":
        return <Hash size={16} color="#0176D3" />;
      case "date":
      case "datetime":
        return <Calendar size={16} color="#0176D3" />;
      case "boolean":
        return <ToggleLeft size={16} color="#0176D3" />;
      default:
        return <Type size={16} color="#0176D3" />;
    }
  };



  const renderField = ({ item, index }: { item: SalesforceField; index: number }) => {
    const isPicklist = item.type.toLowerCase() === 'picklist' || item.type.toLowerCase() === 'multipicklist';
    const isLookup = item.referenceTo && item.referenceTo.length > 0;
    const isMasterDetail = isLookup && !item.nillable && item.cascadeDelete;
    const hasPicklistValues = item.picklistValues && item.picklistValues.length > 0;
    const hasChildRelationships = item.childRelationships && item.childRelationships.length > 0;
    const hasStandardFieldValues = hasStandardValues(Array.isArray(objectName) ? objectName[0] : objectName!, item.name);
    const standardValueSetName = getStandardValueSetName(Array.isArray(objectName) ? objectName[0] : objectName!, item.name);

    const handlePress = () => {
      router.push({
        pathname: "/(tabs)/(objects)/field-details",
        params: { 
          objectName: Array.isArray(objectName) ? objectName[0] : objectName,
          fieldName: item.name,
          fieldLabel: item.label,
          fieldType: item.type,
        }
      });
    };

    const handlePicklistPress = (e: any) => {
      e.stopPropagation();
      router.push({
        pathname: "/(tabs)/(objects)/picklist-values",
        params: {
          fieldLabel: item.label,
          fieldName: item.name,
          fieldType: item.type,
          picklistValues: JSON.stringify(item.picklistValues || []),
        }
      });
    };

    const handleStandardValuesPress = (e: any) => {
      e.stopPropagation();
      router.push({
        pathname: "/(tabs)/(objects)/standard-values",
        params: {
          objectName: Array.isArray(objectName) ? objectName[0] : objectName,
          fieldName: item.name,
          fieldLabel: item.label,
        }
      });
    };

    return (
      <View style={styles.fieldCardContainer}>
        <TouchableOpacity
          style={[
            styles.fieldCard,
            standardValueSetName && styles.standardValueSetFieldCard,
            isLookup && !isMasterDetail && styles.lookupFieldCard,
            isMasterDetail && styles.masterDetailFieldCard
          ]}
          onPress={handlePress}
          testID={`field-${item.name}`}
          activeOpacity={0.9}
        >
        <View style={styles.fieldIcon}>
          {isPicklist ? <List size={16} color="#0176D3" /> : 
           isLookup ? <Link size={16} color="#0176D3" /> : 
           getFieldIcon(item.type)}
        </View>
        <View style={styles.fieldInfo}>
          <Text style={styles.fieldLabel}>{item.label}</Text>
          <Text style={styles.fieldName}>{item.name}</Text>
          <View style={styles.fieldMeta}>
            <View style={styles.fieldTypeBadge}>
              <Text style={styles.fieldType}>{item.type}</Text>
            </View>
            {item.length > 0 && (
              <View style={styles.fieldLengthBadge}>
                <Text style={styles.fieldLength}>({item.length})</Text>
              </View>
            )}
            {standardValueSetName && (
              <View style={styles.standardValueSetBadge}>
                <Text style={styles.standardValueSetText}>StandardValueSet: {standardValueSetName}</Text>
              </View>
            )}
            {item.required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            )}
            {item.unique && (
              <View style={styles.uniqueBadge}>
                <Text style={styles.uniqueText}>Unique</Text>
              </View>
            )}
            {isLookup && (
              <View style={isMasterDetail ? styles.masterDetailBadge : styles.lookupBadge}>
                <Text style={isMasterDetail ? styles.masterDetailText : styles.lookupText}>
                  {isMasterDetail ? 'Master-Detail' : 'Lookup'}
                </Text>
              </View>
            )}
          </View>
          {isPicklist && hasPicklistValues && (
            <TouchableOpacity 
              style={styles.picklistButton}
              onPress={handlePicklistPress}
              activeOpacity={0.7}
            >
              <View style={styles.picklistButtonContent}>
                <List size={14} color="#1565C0" />
                <Text style={styles.picklistButtonText}>
                  View {item.picklistValues!.length} picklist values
                </Text>
                <ExternalLink size={14} color="#1565C0" />
              </View>
            </TouchableOpacity>
          )}
          {hasStandardFieldValues && !standardValueSetName && (
            <TouchableOpacity 
              style={styles.standardValuesButton}
              onPress={handleStandardValuesPress}
              activeOpacity={0.7}
            >
              <View style={styles.standardValuesButtonContent}>
                <Star size={14} color="#F57C00" />
                <Text style={styles.standardValuesButtonText}>
                  View standard values
                </Text>
                <ExternalLink size={14} color="#F57C00" />
              </View>
            </TouchableOpacity>
          )}
          {isLookup && item.referenceTo && (
            <View style={styles.referenceContainer}>
              <Text style={styles.referenceLabel}>References:</Text>
              <Text style={styles.referenceText}>{item.referenceTo.join(', ')}</Text>
              {item.relationshipName && (
                <View style={styles.relationshipNameContainer}>
                  <Text style={styles.relationshipNameLabel}>Relationship Name:</Text>
                  <Text style={styles.relationshipNameText}>{item.relationshipName}</Text>
                </View>
              )}
            </View>
          )}
          {hasChildRelationships && (
            <View style={styles.childRelationshipsContainer}>
              <Text style={styles.childRelationshipsLabel}>Child Relationships:</Text>
              {item.childRelationships!.map((rel, index) => (
                <View key={index} style={styles.childRelationshipItem}>
                  <Text style={styles.childRelationshipText}>
                    {rel.childSObject} ({rel.relationshipName})
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.chevronContainer}>
          <ChevronRight size={20} color="#706E6B" />
        </View>
      </TouchableOpacity>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load fields</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: headerTitle,
        headerStyle: {
          backgroundColor: "#1B96FF",
        },
        headerTintColor: "#FFFFFF",
        headerBackTitle: "",
      }} />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search fields..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {fields.length} fields • {fields.filter(f => f.custom).length} custom • {fields.filter(f => !f.custom).length} standard
          </Text>
        </View>

        <View style={styles.filtersContainer}>
          {/* Primary Filters Row */}
          <View style={styles.primaryFiltersRow}>
            <TouchableOpacity
              style={[styles.filterButton, filters.fieldType === 'all' && styles.filterButtonActive]}
              onPress={() => setFieldTypeFilter('all')}
              testID="filter-all-fields"
            >
              <Text style={[styles.filterButtonText, filters.fieldType === 'all' && styles.filterButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filters.fieldType === 'standard' && styles.filterButtonActive]}
              onPress={() => setFieldTypeFilter('standard')}
              testID="filter-standard-fields"
            >
              <Text style={[styles.filterButtonText, filters.fieldType === 'standard' && styles.filterButtonTextActive]}>
                Standard
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filters.fieldType === 'custom' && styles.filterButtonActive]}
              onPress={() => setFieldTypeFilter('custom')}
              testID="filter-custom-fields"
            >
              <Text style={[styles.filterButtonText, filters.fieldType === 'custom' && styles.filterButtonTextActive]}>
                Custom
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.moreFiltersButton}
              onPress={() => setShowAllFilters(!showAllFilters)}
              testID="toggle-more-filters"
            >
              <Filter size={16} color="#1A73E8" />
              <Text style={styles.moreFiltersText}>Filters</Text>
              {showAllFilters ? (
                <ChevronUp size={16} color="#1A73E8" />
              ) : (
                <ChevronDown size={16} color="#1A73E8" />
              )}
              {hasActiveFilters && (
                <View style={styles.activeFilterIndicator}>
                  <Text style={styles.activeFilterCount}>
                    {Object.entries(filters).filter(([key, value]) => 
                      key === 'fieldType' ? value !== 'all' : Boolean(value)
                    ).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Expandable Filters Grid */}
          {showAllFilters && (
            <View style={styles.expandedFiltersContainer}>
              <View style={styles.filtersGrid}>
                <TouchableOpacity
                  style={[styles.gridFilterButton, filters.required && styles.gridFilterButtonActive]}
                  onPress={() => toggleFilter('required')}
                  testID="filter-required"
                >
                  <Text style={[styles.gridFilterButtonText, filters.required && styles.gridFilterButtonTextActive]}>
                    Required
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.gridFilterButton, filters.unique && styles.gridFilterButtonActive]}
                  onPress={() => toggleFilter('unique')}
                  testID="filter-unique"
                >
                  <Text style={[styles.gridFilterButtonText, filters.unique && styles.gridFilterButtonTextActive]}>
                    Unique
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.gridFilterButton, filters.lookup && styles.gridFilterButtonActive]}
                  onPress={() => toggleFilter('lookup')}
                  testID="filter-lookup"
                >
                  <Link size={14} color={filters.lookup ? "#FFFFFF" : "#1A73E8"} />
                  <Text style={[styles.gridFilterButtonText, filters.lookup && styles.gridFilterButtonTextActive]}>
                    Lookup
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.gridFilterButton, filters.picklist && styles.gridFilterButtonActive]}
                  onPress={() => toggleFilter('picklist')}
                  testID="filter-picklist"
                >
                  <List size={14} color={filters.picklist ? "#FFFFFF" : "#1A73E8"} />
                  <Text style={[styles.gridFilterButtonText, filters.picklist && styles.gridFilterButtonTextActive]}>
                    Picklist
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.gridFilterButton, filters.masterDetail && styles.gridFilterButtonActive]}
                  onPress={() => toggleFilter('masterDetail')}
                  testID="filter-master-detail"
                >
                  <Text style={[styles.gridFilterButtonText, filters.masterDetail && styles.gridFilterButtonTextActive]}>
                    Master-Detail
                  </Text>
                </TouchableOpacity>
              </View>
              
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.clearAllFiltersButton}
                  onPress={clearAllFilters}
                  testID="clear-filters"
                >
                  <Text style={styles.clearAllFiltersText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0176D3" />
            <Text style={styles.loadingText}>Loading fields...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredFields}
            renderItem={renderField}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => refetch()}
                tintColor="#0176D3"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? "No fields found" : "No fields available"}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </>
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
  searchContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
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
  searchInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  statsContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
  },
  statsText: {
    fontSize: 14,
    color: "#5F6368",
    fontWeight: "500",
  },
  listContent: {
    paddingVertical: 12,
  },
  fieldCardContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  fieldCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F3F4",
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
  fieldIcon: {
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
  fieldInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202124",
    marginBottom: 4,
    lineHeight: 22,
  },
  fieldName: {
    fontSize: 13,
    color: "#5F6368",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  fieldMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  fieldTypeBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  fieldType: {
    fontSize: 12,
    color: "#1565C0",
    fontWeight: "600",
  },
  fieldLengthBadge: {
    backgroundColor: "#F3E5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1BEE7",
  },
  fieldLength: {
    fontSize: 11,
    color: "#7B1FA2",
    fontWeight: "600",
  },
  requiredBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCC02",
  },
  requiredText: {
    fontSize: 11,
    color: "#E65100",
    fontWeight: "700",
  },
  uniqueBadge: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  uniqueText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "700",
  },
  lookupBadge: {
    backgroundColor: "#E1F5FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#81D4FA",
  },
  lookupText: {
    fontSize: 11,
    color: "#0277BD",
    fontWeight: "700",
  },
  masterDetailBadge: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  masterDetailText: {
    fontSize: 11,
    color: "#C62828",
    fontWeight: "700",
  },
  picklistButton: {
    marginTop: 8,
    backgroundColor: "#E8F0FE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBDEFB",
    overflow: "hidden",
  },
  picklistButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  picklistButtonText: {
    fontSize: 13,
    color: "#1565C0",
    fontWeight: "600",
    flex: 1,
  },
  referenceContainer: {
    marginTop: 8,
    backgroundColor: "#F1F8E9",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  referenceLabel: {
    fontSize: 12,
    color: "#388E3C",
    fontWeight: "600",
    marginBottom: 4,
  },
  referenceText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "500",
  },
  relationshipNameContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E8F5E8",
  },
  relationshipNameLabel: {
    fontSize: 11,
    color: "#388E3C",
    fontWeight: "600",
    marginBottom: 2,
  },
  relationshipNameText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "500",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  childRelationshipsContainer: {
    marginTop: 8,
    backgroundColor: "#FFF8E1",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  childRelationshipsLabel: {
    fontSize: 12,
    color: "#F57F17",
    fontWeight: "600",
    marginBottom: 6,
  },
  childRelationshipItem: {
    backgroundColor: "#FFFDE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#FFF176",
  },
  childRelationshipText: {
    fontSize: 11,
    color: "#E65100",
    fontWeight: "500",
  },
  filtersContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  primaryFiltersRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DADCE0",
    minWidth: 60,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#1A73E8",
    borderColor: "#1A73E8",
  },
  filterButtonText: {
    fontSize: 13,
    color: "#5F6368",
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  moreFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBDEFB",
    gap: 6,
    marginLeft: "auto",
  },
  moreFiltersText: {
    fontSize: 13,
    color: "#1A73E8",
    fontWeight: "600",
  },
  activeFilterIndicator: {
    backgroundColor: "#EA4335",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  activeFilterCount: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  expandedFiltersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F3F4",
    backgroundColor: "#FAFBFC",
  },
  filtersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  gridFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E8EAED",
    minWidth: 100,
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  gridFilterButtonActive: {
    backgroundColor: "#1A73E8",
    borderColor: "#1A73E8",
  },
  gridFilterButtonText: {
    fontSize: 13,
    color: "#1A73E8",
    fontWeight: "600",
  },
  gridFilterButtonTextActive: {
    color: "#FFFFFF",
  },
  clearAllFiltersButton: {
    backgroundColor: "#EA4335",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EA4335",
    alignSelf: "center",
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#EA4335",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  clearAllFiltersText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#5F6368",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#EA4335",
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#1A73E8",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
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
  chevronContainer: {
    padding: 4,
  },
  standardValuesButton: {
    marginTop: 8,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE082",
    overflow: "hidden",
  },
  standardValuesButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  standardValuesButtonText: {
    fontSize: 13,
    color: "#F57C00",
    fontWeight: "600",
    flex: 1,
  },
  standardValueSetFieldCard: {
    backgroundColor: "#F3E5F5",
    borderColor: "#9C27B0",
    borderWidth: 2,
  },
  standardValueSetBadge: {
    backgroundColor: "#9C27B0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7B1FA2",
  },
  standardValueSetText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  lookupFieldCard: {
    backgroundColor: "#E1F5FE",
    borderColor: "#0277BD",
    borderWidth: 2,
  },
  masterDetailFieldCard: {
    backgroundColor: "#FFEBEE",
    borderColor: "#C62828",
    borderWidth: 2,
  },
});