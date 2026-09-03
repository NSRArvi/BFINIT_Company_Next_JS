import { Inter, Roboto } from "next/font/google";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import AuthProvider from "@/provider/AuthProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "Free Ecommerce Website Builder | Bfinit Ecommerce",
  description:
    "e-Bfinit is a global E-commerce platform for micro, small, medium to large businesses. Built to grow with no transectional charges & built in features like SEO, Blogs, Free SSL certificate, Bitss Cyber Security & Unlimited Traffic. With built in hosting plan to match your e-commerce platform.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${roboto.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <AuthProvider>
        <body className="min-h-full flex flex-col">
          <Navbar />
          {children}
          <Footer />
          {/* chatting feature script */}
          {/* <Chatbot /> */}
        </body>
      </AuthProvider>
    </html>
  );
}
