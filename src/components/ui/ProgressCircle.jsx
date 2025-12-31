const ProgressCircle = ({ score }) => {
  return (
    <svg className="w-full h-full" viewBox="0 0 36 36">
      {/* Background circle */}
      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--color-border-light)" strokeWidth="2" />
      {/* Progress circle - starts from top */}
      <circle
        cx="18"
        cy="18"
        r="15.9155"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeDasharray={`${(score / 100) * 100}, 100`}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
};

export default ProgressCircle;
