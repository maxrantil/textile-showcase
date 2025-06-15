import BackButton from '@/components/adaptive/UI'

interface ProjectNavigationProps {
  className?: string
}

export function ProjectNavigation({ className = '' }: ProjectNavigationProps) {
  return (
    <div className={`text-center padding-mobile-lg ${className}`}>
      <BackButton />
    </div>
  )
}
