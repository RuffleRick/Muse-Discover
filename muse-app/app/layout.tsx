import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"Muse - Your Private Brainstorming Room",description:"Explore creative app ideas, follow different paths, pin your favorites, and make a Codex opening prompt and build workflow.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
