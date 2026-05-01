/**
 * Example usage of PortalPicker component
 * 
 * This file demonstrates how to use the PortalPicker component
 * in your application with search and clear functionality.
 */

'use client';

import { useState } from 'react';
import { PortalPicker } from './PortalPicker';

export const PortalPickerExample = () => {
    const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold">Portal Picker Example</h2>
            
            {/* Basic usage with search and clear */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium">Basic Usage</h3>
                <PortalPicker
                    value={selectedPortalId}
                    onChange={setSelectedPortalId}
                />
                <p className="text-xs text-muted-foreground">
                    ✅ Includes search functionality
                    <br />
                    ✅ Shows clear button (X) when a portal is selected
                </p>
            </div>

            {/* Custom labels and placeholders */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium">Custom Labels</h3>
                <PortalPicker
                    value={selectedPortalId}
                    onChange={setSelectedPortalId}
                    label="Choose Publication Portal"
                    placeholder="Pick your portal..."
                    searchPlaceholder="Type to search portals..."
                />
            </div>

            {/* Disabled state */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium">Disabled State</h3>
                <PortalPicker
                    value={selectedPortalId}
                    onChange={setSelectedPortalId}
                    disabled={true}
                    label="Portal (Locked)"
                />
                <p className="text-xs text-muted-foreground">
                    Clear button is hidden when disabled
                </p>
            </div>

            {/* Display selected value */}
            {selectedPortalId && (
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
                    <p className="text-sm">
                        Selected Portal ID: <strong>{selectedPortalId}</strong>
                    </p>
                    <button
                        onClick={() => setSelectedPortalId(null)}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                    >
                        Clear selection programmatically
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * Props Interface:
 * 
 * interface PortalPickerProps {
 *     value: string | null;                    // The currently selected portal ID
 *     onChange: (value: string | null) => void; // Callback when selection changes
 *     disabled?: boolean;                      // Optional: disable the picker
 *     label?: string;                          // Optional: custom label (default: "Portal")
 *     placeholder?: string;                    // Optional: custom placeholder (default: "Select portal...")
 *     searchPlaceholder?: string;              // Optional: search input placeholder (default: "Search portals...")
 * }
 * 
 * Features:
 * - 🔍 Built-in search functionality to filter portals by name
 * - ❌ Clear button (X icon) appears when a portal is selected
 * - ✓ Checkmark indicator shows the currently selected portal
 * - 📋 Dropdown opens in a popover with smooth animations
 * - ⌨️ Keyboard accessible (Arrow keys, Enter, Escape)
 */
