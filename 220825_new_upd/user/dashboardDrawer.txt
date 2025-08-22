/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Theme,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeftFromLine } from "lucide-react";
import Image from "next/image";

export const DRAWER_WIDTH = 300;
export const HEADER_HEIGHT = 64;
export const BORDER_COLOR = "#E6E8EB";

interface AppDrawerProps {
  navigationItems: Array<{ text: string; path: string; icon?: React.ReactNode; matchPaths?: string[] }>;
  open: boolean;
  onToggle: (open: boolean) => void;
}

export default function AppDrawer({ navigationItems, open, onToggle }: AppDrawerProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const handleDrawerToggle = () => onToggle(!open);

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        [`& .MuiDrawer-paper`]: {
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${BORDER_COLOR}`, // right separator
          ...(open ? openedMixin(theme) : closedMixin(theme)),
        },
      }}
    >
      {open && (
        <>
          <Toolbar
            sx={{
              minHeight: `${HEADER_HEIGHT}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              // bottom border under logo row
              borderBottom: `1px solid ${BORDER_COLOR}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1}}>
              {/* crisp logo; ensure the source image is at least 320×80 px */}
              <Image
                src="/medical-logo.png"
                alt="Company Logo"
                width={160}
                height={40}
                priority
                quality={100}
                style={{ width: 160, height: "auto" }}
              />
            </Box>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{ border: "1px solid #e4e5e7", borderRadius: "8px" }}
            >
              <ArrowLeftFromLine size={16} />
            </IconButton>
          </Toolbar>

          <List sx={{ px: 2, py: 4 }}>
            {navigationItems.map((item) => {
              const selected = item.matchPaths
                ? item.matchPaths.includes(pathname)
                : pathname === item.path;
              return (
                <ListItemButton
                  key={item.text}
                  onClick={() => router.push(item.path)}
                  sx={{
                    borderRadius: "8px",
                    mb: 0.5,
                    backgroundColor: selected ? "#f2f2f2" : "transparent",
                    "&:hover": {
                      backgroundColor: selected ? "#f2f2f2" : "#f7f7f7",
                    },
                  }}
                >
                  {item.icon ? (
                    <ListItemIcon sx={{ minWidth: 30, "& svg": { fontSize: 18, color: "#000" } }}>
                      {item.icon}
                    </ListItemIcon>
                  ) : (
                    <ListItemIcon sx={{ minWidth: 30 }} />
                  )}
                  <ListItemText
                    primary={item.text}
                    sx={{
                      "& .MuiListItemText-primary": {
                        fontWeight: selected ? 600 : 400,
                        color: "#000",
                      },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          {/* Footer */}
          <Box sx={{ mt: "auto" }}>
            {/* Bottom border under Upgrade section */}
            <Box sx={{ px: 2, pb: 2, borderBottom: `1px solid ${BORDER_COLOR}` }}>
              <Button
                variant="outlined"
                fullWidth
                sx={{ borderRadius: "8px", textTransform: "capitalize" }}
              >
                Upgrade Plan
              </Button>
            </Box>

            <Box sx={{ textAlign: "center", py: 1.5 }}>
              <Typography variant="body2" color="textPrimary">
                © {new Date().getFullYear()} – HFA Tools
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Drawer>
  );
}

interface MixinProps {
  width: number | string;
  transition: string;
  overflowX: "hidden" | "auto" | "visible" | "scroll";
  [key: string]: any;
}

const openedMixin = (theme: Theme): MixinProps => ({
  width: DRAWER_WIDTH,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): MixinProps => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: 0,
});
