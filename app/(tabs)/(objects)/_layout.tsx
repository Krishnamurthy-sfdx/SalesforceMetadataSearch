import { Stack } from "expo-router";

export default function ObjectsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="list" 
        options={{ 
          headerShown: false,
          title: "",
        }} 
      />
      <Stack.Screen 
        name="[objectName]" 
        options={{ 
          title: "",
          headerStyle: {
            backgroundColor: "#1B96FF",
          },
          headerTintColor: "#FFFFFF",
          headerBackTitle: "",
        }} 
      />
      <Stack.Screen 
        name="field-details" 
        options={{ 
          title: "Field Details",
          headerStyle: {
            backgroundColor: "#1B96FF",
          },
          headerTintColor: "#FFFFFF",
          headerBackTitle: "",
        }} 
      />
      <Stack.Screen 
        name="picklist-values" 
        options={{ 
          headerStyle: {
            backgroundColor: "#1B96FF",
          },
          headerTintColor: "#FFFFFF",
          headerBackTitle: "",
        }} 
      />
      <Stack.Screen 
        name="metadata-reference" 
        options={{ 
          title: "Metadata Reference",
          headerStyle: {
            backgroundColor: "#1B96FF",
          },
          headerTintColor: "#FFFFFF",
          headerBackTitle: "",
        }} 
      />
    </Stack>
  );
}