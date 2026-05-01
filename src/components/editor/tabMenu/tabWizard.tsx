'use client';

import HorizontalStepIndicator2 from "@/components/creation-hub/advanced/HorizontalStepIndicator2";


interface EditorMenuTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLoadVersions: () => void;
    menuVersion: 'menu0' | 'menu1' | 'menu2';
}

const stepTitles = ['Article', 'Featured image', 'Add images', 'Publish'];
const stepValues = ['editor', 'image', 'images', 'publish'];
const totalSteps = stepTitles.length;

export default function EditorMenuTabsWizard({ activeTab, setActiveTab }: EditorMenuTabsProps) {
    const currentStep = stepValues.indexOf(activeTab) + 1;

    const handleStepClick = (stepIndex: number) => {
        setActiveTab(stepValues[stepIndex]);
    }

    // Menu2 version - different styling and layout
    return (
        <div className="flex border-b bg-gradient-to-r from-background to-muted/20 pr-4">
            <div className={`w-full px-6 py-4 text-sm font-semibold transition-all flex items-center gap-3`}>
                <HorizontalStepIndicator2
                    totalSteps={totalSteps}
                    currentStep={currentStep}
                    stepTitles={stepTitles}
                    onStepClick={handleStepClick}
                />
            </div>
        </div>
    );

}
