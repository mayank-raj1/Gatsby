"use client"
import { useState } from "react"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { IconChartBar, IconDashboard, IconPigMoney, IconReportMoney } from "@tabler/icons-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"

export default function MainSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  // Navigation paths
  const routes = {
    DASHBOARD: "/dashboard",
    BUDGET: "/budget",
    SAVINGS: "/savings",
    ANALYTICS: "/analytics"
  }

  const links = [
    {
      label: "DASHBOARD",
      href: routes.DASHBOARD,
      icon: <IconDashboard className="h-6 w-6 shrink-0 text-black" />,
      bgColor: "bg-[#FF5E5B]",
    },
    {
      label: "BUDGET",
      href: routes.BUDGET,
      icon: <IconReportMoney className="h-6 w-6 shrink-0 text-black" />,
      bgColor: "bg-[#D8D8D8]",
    },
    {
      label: "SAVINGS",
      href: routes.SAVINGS,
      icon: <IconPigMoney className="h-6 w-6 shrink-0 text-black" />,
      bgColor: "bg-[#00CECB]",
    },
    {
      label: "ANALYTICS",
      href: routes.ANALYTICS,
      icon: <IconChartBar className="h-6 w-6 shrink-0 text-black" />,
      bgColor: "bg-[#FFE74C]",
    },
  ]

  const [open, setOpen] = useState(true)

  // Function to handle navigation
  const handleNavigation = (path: string) => {
    router.push(path)
  }

  // Function to check if the current path matches a link
  const isActivePath = (href: string) => {
    return pathname === href
  }

  return (
      <Sidebar open={open} setOpen={setOpen} className={cn(
          "h-screen border-r-4 border-black bg-[#f0f0f0]",
          "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
      )}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-4">
              {links.map((link, idx) => (
                  <SidebarLink
                      key={idx}
                      link={{
                        ...link,
                        onClick: () => handleNavigation(link.href) // Navigate with router
                      }}
                      className={cn(
                          link.bgColor,
                          "hover:bg-white transition-all duration-150 p-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
                          isActivePath(link.href) ? "bg-white" : "" // Highlight active route
                      )}
                  />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
  )
}

export const Logo = () => {
  return (
      <a href="#" className="relative z-20 flex items-center space-x-2 py-3 text-lg font-bold text-black">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-12 w-12 shrink-0 rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover"
        />
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-black tracking-wider whitespace-pre text-black uppercase"
        >
          Gatsby
        </motion.span>
      </a>
  )
}

export const LogoIcon = () => {
  return (
      <a href="#" className="relative z-20 flex items-center space-x-2 py-3 text-lg font-bold text-black">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-12 w-12 shrink-0 rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover"
        />
      </a>
  )
}