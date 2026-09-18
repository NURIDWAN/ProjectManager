import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface Contributor {
    id: number;
    name: string;
}

interface ContributorBadgesProps {
    contributors?: Contributor[];
    fallback?: Contributor | null;
    maxVisible?: number;
}

function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || '?';
}

export function ContributorBadges({
    contributors = [],
    fallback,
    maxVisible = 4,
}: ContributorBadgesProps) {
    const unique = new Map<number, Contributor>();
    [...contributors, ...(fallback ? [fallback] : [])].forEach((person) => {
        if (person?.id && !unique.has(person.id)) unique.set(person.id, person);
    });

    const people = Array.from(unique.values());
    if (people.length === 0) {
        return <span className="text-muted-foreground">-</span>;
    }

    const visible = people.slice(0, maxVisible);
    const remaining = people.length - visible.length;

    return (
        <TooltipProvider>
            <div className="relative">
                <div
                    className="flex items-center pl-2"
                    aria-label={`${people.length} kontributor laporan`}
                >
                    {visible.map((person, index) => (
                        <Tooltip key={person.id}>
                            <TooltipTrigger
                                type="button"
                                className="relative -ml-2 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-primary-foreground outline-none transition-transform hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring"
                                style={{ zIndex: visible.length - index }}
                                aria-label={`Kontributor: ${person.name}`}
                            >
                                {initials(person.name)}
                            </TooltipTrigger>
                            <TooltipContent>{person.name}</TooltipContent>
                        </Tooltip>
                    ))}
                    {remaining > 0 && (
                        <Tooltip>
                            <TooltipTrigger
                                type="button"
                                className="relative -ml-2 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground outline-none hover:z-10 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`${remaining} kontributor lainnya`}
                            >
                                +{remaining}
                            </TooltipTrigger>
                            <TooltipContent>{remaining} kontributor lainnya</TooltipContent>
                        </Tooltip>
                    )}
                </div>

            </div>
        </TooltipProvider>
    );
}
