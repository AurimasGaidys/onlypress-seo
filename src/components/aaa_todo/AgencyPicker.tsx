import { useAgencyData } from "@/hooks/useAgencyData";
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Workspace } from "@/context/WorkspaceContext";
import { useMemo } from "react";

interface Props {
    activeWorkspace: Workspace,
    selectedClientId: string | null,
    selectedProjectId: string | null,
    setSelectedClientId: (value: string | null) => void
    setSelectedProjectId: (value: string | null) => void
    disabled: boolean
}

export const ClientPicker = (props: Props) => {
    const {
        activeWorkspace,
        selectedClientId,
        selectedProjectId,
        setSelectedClientId,
        setSelectedProjectId,
        disabled
    } = props;

    const { clients, projects, loading: agencyDataLoading } = useAgencyData(
        activeWorkspace.type === 'agency' ? activeWorkspace.id || '' : ''
    );

    // Rodykime projektus pagal pasirinktą klientą
    const availableProjects = useMemo(() => {
        if (!selectedClientId) return [];
        return projects.filter(project => project.clientId === selectedClientId);
    }, [projects, selectedClientId]);

    return <div className="flex flex-row gap-4">
        {activeWorkspace.type === 'user' && (
            <div className="space-y-2 flex-1">
                <Select 
                    value="personal"
                    onValueChange={() => { }}
                    disabled
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Personal Space" />
                    </SelectTrigger>
                </Select>
            </div>
        )}
        {/* Client Selection (Agency only) */}
        {activeWorkspace.type === 'agency' && clients.length > 0 && (

            <div className="space-y-2 flex-1">
                <Label htmlFor="client-select">Client</Label>
                <Select
                    value={selectedClientId || ''}
                    onValueChange={setSelectedClientId}
                    disabled={agencyDataLoading || disabled}
                >
                    <SelectTrigger id="client-select">
                        <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                                {client.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}

        {/* Project Selection (Agency only) */}
        {activeWorkspace.type === 'agency' && availableProjects.length > 0 && (
            <div className="space-y-2 flex-1">
                <Label htmlFor="project-select">Project</Label>
                <Select
                    value={selectedProjectId || ''}
                    onValueChange={setSelectedProjectId}
                    disabled={!selectedClientId || agencyDataLoading || disabled}
                >
                    <SelectTrigger id="project-select">
                        <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableProjects.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                                {project.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
    </div>
}
