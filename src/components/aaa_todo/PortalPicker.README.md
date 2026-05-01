# PortalPicker Component

A reusable, searchable dropdown component for selecting portals in your application. This component provides a clean interface for portal selection with built-in search functionality, clear button, loading states, and customizable options.

## Location
`src/components/aaa_todo/PortalPicker.tsx`

## Features

- ✅ **Value & onChange Props**: Controlled component with `value` and `onChange` for managing selection state
- ✅ **Search Functionality**: Built-in search to filter portals by name in real-time
- ✅ **Clear Button**: X button appears when a portal is selected, allowing users to clear the selection
- ✅ **Portal List**: Automatically fetches and displays all available portals using the `usePortals` hook
- ✅ **Loading State**: Shows "Loading portals..." placeholder while fetching data
- ✅ **Checkmark Indicator**: Visual checkmark shows the currently selected portal
- ✅ **Keyboard Accessible**: Full keyboard navigation support (Arrow keys, Enter, Escape)
- ✅ **Customizable**: Supports custom labels and placeholders
- ✅ **Disabled State**: Can be disabled when needed (clear button is hidden when disabled)
- ✅ **Type-Safe**: Full TypeScript support with proper typing

## Props

```typescript
interface PortalPickerProps {
    value: string | null;                    // The currently selected portal ID
    onChange: (value: string | null) => void; // Callback when selection changes
    disabled?: boolean;                      // Optional: disable the picker (default: false)
    label?: string;                          // Optional: custom label (default: "Portal")
    placeholder?: string;                    // Optional: custom placeholder (default: "Select portal...")
    searchPlaceholder?: string;              // Optional: search input placeholder (default: "Search portals...")
}
```

## Basic Usage

```tsx
import { useState } from 'react';
import { PortalPicker } from '@/components/aaa_todo/PortalPicker';

function MyComponent() {
    const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);

    return (
        <PortalPicker
            value={selectedPortalId}
            onChange={setSelectedPortalId}
        />
    );
}
```

## Advanced Usage Examples

### With Custom Label and Placeholder

```tsx
<PortalPicker
    value={selectedPortalId}
    onChange={setSelectedPortalId}
    label="Choose Publication Portal"
    placeholder="Pick a portal to publish to..."
/>
```

### Disabled State

```tsx
<PortalPicker
    value={selectedPortalId}
    onChange={setSelectedPortalId}
    disabled={true}
    label="Portal (Locked)"
/>
```

### In a Form

```tsx
function PublishingForm() {
    const [formData, setFormData] = useState({
        portalId: null,
        // ... other form fields
    });

    return (
        <form>
            <PortalPicker
                value={formData.portalId}
                onChange={(portalId) => setFormData(prev => ({ ...prev, portalId }))}
                label="Target Portal"
            />
            {/* Other form fields */}
        </form>
    );
}
```

## User Interface

The component uses a **Popover + Command** pattern for the dropdown, which provides:
- Smooth animations when opening/closing
- Search input with magnifying glass icon
- Scrollable list for long portal lists (max height: 300px)
- Checkmark indicator for the selected portal
- "No portal found" message when search returns no results

## Dependencies

- `usePortals` hook - Fetches portal data from the API
- `Label` component - From `@/components/ui/label`
- `Button` component - From `@/components/ui/button`
- `Popover` components - From `@/components/ui/popover`
- `Command` components - From `@/components/ui/command`
- Icons from `lucide-react` - Check, ChevronsUpDown, X

## Data Source

The component uses the `usePortals` hook which:
- Fetches portals from `/api/portals/list`
- Returns `PortalPublic[]` data type
- Includes portal ID and title for display
- Handles loading and error states

## Portal Data Structure

Each portal in the dropdown has:
- `id` - Unique portal identifier (used as value)
- `title` - Display name shown in the dropdown

## See Also

- Example usage: `PortalPicker.example.tsx`
- Similar components: `AgencyPicker.tsx`, `DateSelector.tsx`
- Portal types: `src/types/portalPublic.ts`
- Portal hook: `src/hooks/usePortals.ts`
