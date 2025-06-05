import * as React from "react"
import {
  Database,
  Settings,
  Calendar,
  Activity,
  HardDrive,
  Shield,
  Clock,
  Archive,
  Server,
  Download,
  Moon,
  Sun,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useTheme } from "@/components/theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Admin",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "Supabase Backup",
      logo: Database,
      plan: "Pro",
    },
    {
      name: "Personal Projects",
      logo: Server,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Activity,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Recent Backups",
          url: "/dashboard/backups",
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
      ],
    },
    {
      title: "Projects",
      url: "/dashboard/projects",
      icon: Database,
      items: [
        {
          title: "All Projects",
          url: "/dashboard/projects",
        },
        {
          title: "Add Project",
          url: "/dashboard/projects/new",
        },
        {
          title: "Import/Export",
          url: "/dashboard/projects/import",
        },
      ],
    },
    {
      title: "Backups",
      url: "/dashboard/backups",
      icon: Archive,
      items: [
        {
          title: "Manual Backup",
          url: "/dashboard/backups/manual",
        },
        {
          title: "Scheduled Backups",
          url: "/dashboard/backups/scheduled",
        },
        {
          title: "Backup History",
          url: "/dashboard/backups/history",
        },
        {
          title: "Restore",
          url: "/dashboard/backups/restore",
        },
      ],
    },
    {
      title: "Scheduling",
      url: "/dashboard/scheduling",
      icon: Clock,
      items: [
        {
          title: "Schedule Manager",
          url: "/dashboard/scheduling",
        },
        {
          title: "Retention Policies",
          url: "/dashboard/scheduling/retention",
        },
        {
          title: "Notifications",
          url: "/dashboard/scheduling/notifications",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "/dashboard/settings",
        },
        {
          title: "Security",
          url: "/dashboard/settings/security",
        },
        {
          title: "Storage",
          url: "/dashboard/settings/storage",
        },
        {
          title: "CLI Configuration",
          url: "/dashboard/settings/cli",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Production DB",
      url: "/dashboard/projects/prod",
      icon: Shield,
    },
    {
      name: "Staging DB",
      url: "/dashboard/projects/staging",
      icon: Database,
    },
    {
      name: "Development DB",
      url: "/dashboard/projects/dev",
      icon: Server,
    },
  ],
}

function SidebarModeToggle() {
  const { setTheme } = useTheme()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip="Theme"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">Theme</span>
                <span className="truncate text-xs">Toggle appearance</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="size-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="size-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Settings className="size-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarModeToggle />
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
