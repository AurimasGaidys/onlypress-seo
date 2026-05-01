import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Blueprint } from "@/types/blueprint";

interface ArticleBlueprintProps {
  blueprint: Blueprint;
}

const EMPTY_TEXT = "Nenurodyta";

export default function ArticleBlueprint({ blueprint }: ArticleBlueprintProps) {
  const primarySources = blueprint.primarySources?.filter((source) => source?.name || source?.url) ?? [];
  const keywords = blueprint.keywords?.filter(Boolean) ?? [];
  const objectives = blueprint.objectives?.filter(Boolean) ?? [];
  const distributionChannels = blueprint.distributionChannels?.filter(Boolean) ?? [];

  return (
    <Card className="bg-muted/50">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base">Straipsnio brėžinys</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 text-sm">
        <SimpleField label="Tema" value={blueprint.topic} />
        <SimpleField label="Darbinis pavadinimas" value={blueprint.workingTitle} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SimpleField label="Straipsnio tipas" value={blueprint.type} />
          <SimpleField label="Rakursas" value={blueprint.angle} />
          <SimpleField label="Auditorija" value={blueprint.audience} />
          <SimpleField label="Tonacija" value={blueprint.voiceAndTone} />
        </div>

        {(objectives.length > 0 || keywords.length > 0) && <Separator className="my-2" />}

        {objectives.length > 0 && (
          <TagGroup label="Tikslai" items={objectives} />
        )}

        {keywords.length > 0 && (
          <TagGroup label="Raktažodžiai" items={keywords} />
        )}

        <SimpleField label="Kvietimas veiksmui" value={blueprint.callToAction} />
        <SimpleField label="Publikavimo kanalas" value={blueprint.targetPublication} />
        <SimpleField label="Galutinis terminas" value={blueprint.deadline} />

        {distributionChannels.length > 0 && (
          <TagGroup label="Platinimo kanalai" items={distributionChannels} />
        )}

        {primarySources.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pagrindiniai šaltiniai</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {primarySources.map((source, index) => (
                <li key={`${source.url ?? source.name ?? index}`.toString()}>
                  <span className="font-medium text-foreground">{source.name ?? `Šaltinis ${index + 1}`}</span>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-primary hover:underline break-all"
                    >
                      {source.url}
                    </a>
                  )}
                  {source.note && <span className="ml-2 text-xs">({source.note})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <SimpleField label="Pastabos faktų tikrinimui" value={blueprint.factCheckNotes} multiline />
      </CardContent>
    </Card>
  );
}

interface SimpleFieldProps {
  label: string;
  value?: string;
  multiline?: boolean;
}

function SimpleField({ label, value, multiline = false }: SimpleFieldProps) {
  const displayValue = value?.trim().length ? value.trim() : EMPTY_TEXT;
  return (
    <div className="flex flex-col">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`mt-1 text-sm text-foreground ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>
        {displayValue}
      </span>
    </div>
  );
}

interface TagGroupProps {
  label: string;
  items: string[];
}

function TagGroup({ label, items }: TagGroupProps) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={`${label}-${item}-${index}`} variant="outline" className="text-xs rounded-full">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
