import BackButton from '@/components/layout/BackButton'

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
