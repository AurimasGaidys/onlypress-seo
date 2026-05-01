# TaxDetailsEditor Component

A comprehensive React component for editing tax details (mokesčių duomenys) in the agency management system.

## Features

- ✅ Full form validation using Zod schema
- ✅ Support for different entity types (company, writer, other)
- ✅ Real-time error messages in Lithuanian
- ✅ Automatic save state tracking
- ✅ Conditional fields based on entity type
- ✅ Firebase integration for data persistence
- ✅ Toast notifications for user feedback
- ✅ Responsive design

## Usage

### Basic Implementation

```tsx
import TaxDetailsEditor from '@/components/agency/TaxDetailsEditor';

// In your component
<TaxDetailsEditor 
  agencyId={agencyId} 
  taxDetails={agencyPrivate?.taxDetails}
/>
```

### Example: Adding to SettingsTab

```tsx
// src/components/agency/SettingsTab.tsx
import TaxDetailsEditor from './TaxDetailsEditor';

export default function SettingsTab({ agencyId, agency, agencyPrivate }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Other settings cards */}
      
      <TaxDetailsEditor 
        agencyId={agencyId}
        taxDetails={agencyPrivate?.taxDetails}
      />
      
      {/* More settings */}
    </div>
  );
}
```

### Example: In a Settings Page

```tsx
// src/app/(app)/agency/[agencyId]/settings/page.tsx
import TaxDetailsEditor from '@/components/agency/TaxDetailsEditor';

export default function SettingsPage({ params }: { params: { agencyId: string } }) {
  const { agencyPrivate } = useAgencyData(params.agencyId);
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Mokesčių nustatymai</h1>
      <TaxDetailsEditor 
        agencyId={params.agencyId}
        taxDetails={agencyPrivate?.taxDetails}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `agencyId` | `string` | Yes | The ID of the agency |
| `taxDetails` | `UserTaxDetails` | No | Existing tax details to edit (if any) |

## Data Structure

The component handles the following fields from `UserTaxDetails`:

### Common Fields (All Types)
- `type` - Entity type: "company" \| "writer" \| "other"
- `name` - Company name or individual's full name
- `companyCode` - Company code or personal code
- `adress` - Street address
- `city` - City
- `postalCode` - Postal code
- `country` - Country

### Company-Specific Fields
- `VIT` - VAT number (optional for companies)

### Writer-Specific Fields
- `licenseNumber` - Individual activity license number (required for writers)

## Form Validation

The component uses Zod schema validation (`UserTaxDetailsSchema`) with Lithuanian error messages:
- All required fields show red asterisks (*)
- Real-time validation on field blur
- Inline error messages with icons
- Toast notifications for save operations

## State Management

The component tracks:
- **Form Data**: Current values of all fields
- **Validation Errors**: Field-level error messages
- **Save State**: Whether save operation is in progress
- **Change Detection**: Whether user has unsaved changes

## Conditional Rendering

Fields are conditionally shown based on entity type:
- **Company (`type: "company"`)**:
  - Shows VIT field (optional)
  - Hides license number field
  - Label: "Įmonės pavadinimas"

- **Writer (`type: "writer"`)**:
  - Shows license number field (required)
  - Hides VIT field
  - Label: "Vardas Pavardė"

- **Other (`type: "other"`)**:
  - Shows all basic fields
  - Hides both VIT and license number

## Firebase Integration

The component:
1. Reads from: `agencyPrivate/{agencyId}/taxDetails`
2. Writes to: `agencyPrivate/{agencyId}`
3. Updates both `taxDetails` and `updated` timestamp
4. Uses `serverTimestamp()` for consistency

## Styling

- Uses shadcn/ui components (Card, Input, Label, Button, RadioGroup)
- Tailwind CSS for responsive layouts
- Supports dark/light theme via theme provider
- Error states with red borders and destructive color scheme
- Success indicators with green checkmarks

## Error Handling

- Validation errors shown inline under each field
- Toast notifications for save success/failure
- Console logging for debugging
- Graceful handling of missing data

## Future Enhancements

Potential improvements:
- [ ] Add country selector dropdown
- [ ] Add postal code format validation by country
- [ ] Support for multiple tax profiles
- [ ] VAT number validation API integration
- [ ] Company registry lookup integration
- [ ] Export tax details to PDF
- [ ] History/audit log of changes

## Dependencies

- React (useState, useEffect)
- Firebase (Firestore)
- Zod (validation)
- shadcn/ui components
- lucide-react (icons)
- sonner (toast notifications)

## TypeScript Support

Fully typed with:
- `UserTaxDetails` type from `@/types/agencyPrivate`
- `UserTaxDetailsSchema` for runtime validation
- Props interface with JSDoc comments
