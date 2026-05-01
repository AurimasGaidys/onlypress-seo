import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useAgencyData } from '@/hooks/useAgencyData';
import { Briefcase, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
    agencyId: string;
    selectedProjectId: string | null;
    setSelectedProjectId: (projectId: string, clientId: string) => void;
}

export const ClientPicker = ({
    agencyId,
    selectedProjectId,
    setSelectedProjectId
}: Props) => {
    const { clients, projects, loading } = useAgencyData(agencyId);

    const projectsByClient = useMemo(() => {
        const grouped: { [key: string]: typeof projects } = {};
        projects.forEach(project => {
            if (!grouped[project.clientId]) {
                grouped[project.clientId] = [];
            }
            grouped[project.clientId].push(project);
        });
        return grouped;
    }, [projects]);

    if (loading) {
        return <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
    }
    const projectCategory = clients.filter(c => (projectsByClient[c.id] || []).some(p => p.id === selectedProjectId))?.[0]?.id

    return <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <Select value={projectCategory + "||" + (selectedProjectId || '')} onValueChange={e => {
            const [clientId, projectId] = e.split("||");
            setSelectedProjectId(projectId, clientId);
        }}>
            <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a project..." />
            </SelectTrigger>
            <SelectContent>
                {clients.map(client => (
                    <SelectGroup key={client.id}>
                        <SelectLabel>{client.name}</SelectLabel>
                        {(projectsByClient[client.id] || []).map(project => (
                            <SelectItem key={project.id} value={client.id + "||" + project.id}>
                                {project.name}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                ))}
            </SelectContent>
        </Select>
    </div>
}