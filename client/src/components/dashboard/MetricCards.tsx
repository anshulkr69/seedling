import React from 'react';

interface MetricCardsProps {
  activeApps: number;
  upcomingDeadlines: number;
  matchesCount: number;
  projectsCount: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  activeApps,
  upcomingDeadlines,
  matchesCount,
  projectsCount,
}) => {
  const cards = [
    {
      value: activeApps,
      label: 'Active Applications',
      id: 'metric-active-apps',
    },
    {
      value: upcomingDeadlines,
      label: 'Upcoming Deadlines',
      id: 'metric-upcoming-deadlines',
    },
    {
      value: matchesCount,
      label: 'Grants Matched',
      id: 'metric-grants-matched',
    },
    {
      value: projectsCount,
      label: 'Projects in Vault',
      id: 'metric-projects-vault',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.id}
          id={card.id}
          className="bg-bg-surface border border-border-base rounded-[10px] p-6 flex flex-col justify-between transition-colors duration-150"
        >
          <span className="font-satoshi text-4xl font-bold text-text-primary tabular-nums">
            {card.value}
          </span>
          <span className="font-sans text-xs font-semibold text-text-secondary uppercase tracking-wide mt-2">
            {card.label}
          </span>
        </div>
      ))}
    </div>
  );
};
