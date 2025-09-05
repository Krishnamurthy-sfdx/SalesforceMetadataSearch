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
} from "react-native";
import { router } from "expo-router";
import { ChevronRight, Package, Layers, Grid3X3, Building2 } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { fetchSalesforceObjects } from "@/services/salesforce";
import type { SalesforceObject } from "@/types/salesforce";

export default function ObjectsListScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [objectFilter, setObjectFilter] = useState<'all' | 'custom' | 'standard'>('all');
  const { accessToken, instanceUrl, isAuthenticated, isLoading } = useAuth();

  const { data: objects = [], isLoading: isLoadingObjects, error, refetch } = useQuery({
    queryKey: ["salesforce-objects", instanceUrl, accessToken],
    queryFn: () => fetchSalesforceObjects(instanceUrl!, accessToken!),
    enabled: !!accessToken && !!instanceUrl,
  });

  const filteredObjects = useMemo(() => {
    let filtered = objects;
    
    if (objectFilter === 'custom') {
      filtered = filtered.filter(obj => obj.custom);
    } else if (objectFilter === 'standard') {
      filtered = filtered.filter(obj => !obj.custom);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(obj => 
        obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => a.label.localeCompare(b.label));
  }, [objects, searchQuery, objectFilter]);

  // If not authenticated, show loading or redirect
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0176D3" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Package size={48} color="#706E6B" />
        <Text style={styles.errorText}>Not Connected</Text>
        <Text style={styles.errorSubtext}>
          Go to Settings to configure OAuth or enable Demo Mode
        </Text>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderObject = ({ item }: { item: SalesforceObject }) => (
    <TouchableOpacity
      style={styles.objectCard}
      onPress={() => router.push(`/(tabs)/(objects)/${item.name}`)}
      testID={`object-${item.name}`}
    >
      <View style={styles.objectIcon}>
        {item.custom ? (
          <Package size={22} color="#1B96FF" />
        ) : (
          <Building2 size={22} color="#747474" />
        )}
      </View>
      <View style={styles.objectInfo}>
        <Text style={styles.objectLabel}>{item.label}</Text>
        <Text style={styles.objectName}>{item.name}</Text>
        {item.recordCount !== undefined && (
          <Text style={styles.recordCount}>
            {item.recordCount.toLocaleString()} records
          </Text>
        )}
      </View>
      <ChevronRight size={20} color="#706E6B" />
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load objects</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Salesforce Objects</Text>
        <Text style={styles.subtitle}>Browse and explore your org's metadata</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search objects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, objectFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setObjectFilter('all')}
        >
          <Text style={[styles.filterText, objectFilter === 'all' && styles.filterTextActive]}>
            All ({objects.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, objectFilter === 'standard' && styles.filterButtonActive]}
          onPress={() => setObjectFilter('standard')}
        >
          <Text style={[styles.filterText, objectFilter === 'standard' && styles.filterTextActive]}>
            Standard ({objects.filter(o => !o.custom).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, objectFilter === 'custom' && styles.filterButtonActive]}
          onPress={() => setObjectFilter('custom')}
        >
          <Text style={[styles.filterText, objectFilter === 'custom' && styles.filterTextActive]}>
            Custom ({objects.filter(o => o.custom).length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoadingObjects ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0176D3" />
          <Text style={styles.loadingText}>Loading objects...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredObjects}
          renderItem={renderObject}
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
                {searchQuery ? "No objects found" : "No objects available"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginTop: -20,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F1F3F4",
  },
  searchInput: {
    paddingVertical: 20,
    fontSize: 17,
    color: "#16325C",
    fontWeight: "500",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F7F9FB",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: "#1B96FF",
    borderColor: "#1B96FF",
    shadowColor: "#1B96FF",
    shadowOpacity: 0.15,
  },
  filterText: {
    fontSize: 12,
    color: "#747474",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingVertical: 16,
  },
  objectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F3F4",
  },
  objectIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E1F5FE",
  },
  objectInfo: {
    flex: 1,
  },
  objectLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#16325C",
    marginBottom: 4,
    lineHeight: 22,
  },
  objectName: {
    fontSize: 13,
    color: "#747474",
    fontFamily: "monospace",
    backgroundColor: "#F7F9FB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  recordCount: {
    fontSize: 12,
    color: "#747474",
    marginTop: 6,
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#747474",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 18,
    color: "#C23934",
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#1B96FF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#1B96FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    color: "#747474",
    fontWeight: "500",
  },
  errorSubtext: {
    fontSize: 15,
    color: "#747474",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  settingsButton: {
    backgroundColor: "#1B96FF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#1B96FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});