"use client";
import { useEffect, useRef, useState } from "react";
import { BiChevronDown, BiChevronRight, BiChevronUp } from "react-icons/bi";
import { CgClose } from "react-icons/cg";
import { FaBars } from "react-icons/fa";
import { MdArrowOutward } from "react-icons/md";
import logo from "../../assets/logo/eblogo.png";
import { menuItems } from "@/data/menuItems";
import useAuth from "@/hooks/useAuth";
import Container from "./Container";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { ECOM_BASE_URL } from "@/config";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, token } = useAuth();
  const [showNav, setShowNav] = useState(false);
  const [showChild, setShowChild] = useState("");
  const [showSubMenu, setShowSubMenu] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [hostingProducts, setHostingProducts] = useState([]);
  const [updatedMenuItems, setUpdatedMenuItems] = useState(menuItems);
  const [isScrolled, setIsScrolled] = useState(false);

  const isHome = pathname === "/";

  // fetching hosting products
  useEffect(() => {
    const fetchHostingProducts = async () => {
      const response = await fetch(
        "https://hpanel.bfinit.com/api/product/categories",
      );
      const data = await response.json();
      setHostingProducts(data.data);
    };

    fetchHostingProducts();
  }, []);

  useEffect(() => {
    async function checkAuth() {
      if (!token) return;

      try {
        const res = await fetch(
          `${ECOM_BASE_URL}/api/v1/package-order/user-orders`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.status === 401) {
          logout();
          setUserMenuOpen(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch orders");
      } catch (err) {
        console.error(err.message);
      }
    }

    checkAuth();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [token, logout]);

  // Update the MenuItems when hostingProducts changes
  useEffect(() => {
    if (hostingProducts.length > 0) {
      // Define categories and their respective product IDs
      const categories = {
        "Bare Metal Servers": [1, 3],
        "Virtual Machine": [2, 8],
        Hosting: [4, 5, 7],
      };

      // Map hosting products to categories
      const categorizedProducts = Object.keys(categories).map((category) => {
        const productIds = categories[category];
        const products = hostingProducts.filter((product) =>
          productIds.includes(product.id),
        );
        return {
          header: category,
          subChild: products.map((product) => ({
            name: product.name,
            link: `/hosting-products/${product.id}`,
          })),
        };
      });

      // Add "Build your own VPS" to the "Virtual Machine" category
      const virtualMachineCategory = categorizedProducts.find(
        (cat) => cat.header === "Virtual Machine",
      );
      if (virtualMachineCategory) {
        virtualMachineCategory.subChild.push({
          name: "Build Your Own VPS",
          link: "/build-your-own-vps",
        });
      }

      // Update the MenuItems
      const updatedMenu = updatedMenuItems.map((item) => {
        if (item.name === "Hosting Products") {
          return {
            ...item,
            child: categorizedProducts,
          };
        }
        return item;
      });

      setUpdatedMenuItems(updatedMenu);
    }
  }, [hostingProducts]);

  // Toggle Submenu in Destop View
  const toggleSubMenu = (index) => {
    setShowSubMenu((prev) => (prev === index ? null : index));
  };

  // Function to handle scroll event
  const handleScroll = () => {
    const scrollY = window.scrollY;

    setShowNav(false);
    setShowSubMenu(false);

    if (scrollY >= 10) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className={`fixed z-50 w-full border-b border-brand font-roboto ${isScrolled || !isHome ? "top-0 bg-white" : "top-0 bg-white md:bg-transparent"}`}
    >
      <Container>
        <section
          className={`relative flex items-center justify-between py-4 text-black`}
        >
          {/* logo here  */}
          <Link
            onClick={toggleSubMenu}
            href={"/"}
            className="inline-flex items-center gap-2 text-2xl font-semibold"
          >
            <Image
              width={1000}
              height={1000}
              src={logo}
              className="h-6 md:h-8 w-full"
              alt="Bfinit Company Logo"
              loading="lazy"
            />
            {/* Scotty Pumpkin */}
          </Link>
          {/* desktop view  */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            {updatedMenuItems.map((mi, i) => (
              <div key={i}>
                {mi.child ? (
                  <div className="group hover:underline">
                    <span
                      onClick={() => toggleSubMenu(i)}
                      className="flex cursor-pointer items-center gap-1"
                    >
                      {mi.name}
                      <BiChevronDown className="text-2xl" />
                    </span>
                    {showSubMenu === i && (
                      <div className="absolute left-1/2 top-full grid h-auto max-h-[calc(100vh-80px)] w-2/3 flex-1 -translate-x-1/2 grid-cols-3 gap-4 overflow-y-auto rounded border border-brand bg-white p-5 text-black shadow">
                        {mi.child.map((mc, i) => (
                          <div key={i}>
                            {mc.header ? (
                              <div>
                                <span className="font-semibold">
                                  {mc.header}
                                </span>
                                <ul className="ml-2 mt-2 flex flex-col gap-2">
                                  {mc.subChild.map((mcc, i) => (
                                    <Link
                                      onClick={() => setShowSubMenu(null)}
                                      key={i}
                                      href={mcc.link}
                                      className="flex gap-1.5 duration-300 ease-linear hover:translate-x-3 hover:font-semibold hover:text-brand"
                                    >
                                      <BiChevronRight className="min-w-fit text-2xl" />
                                      {mcc.name}
                                    </Link>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <Link
                                onClick={() => setShowSubMenu(null)}
                                href={mc.link}
                                key={i}
                                className="flex gap-1.5 duration-300 ease-linear hover:translate-x-3"
                              >
                                {mc.icon ? (
                                  <Image
                                    width={1000}
                                    height={1000}
                                    src={mc.icon}
                                    className="size-8 rounded bg-blue-100 p-1"
                                    alt=""
                                  />
                                ) : (
                                  <BiChevronRight className="text-2xl" />
                                )}
                                <div>
                                  <p className="font-semibold">{mc.name}</p>
                                  <p className="mt-1 text-xs text-gray-800">
                                    {mc.description}
                                  </p>
                                </div>
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    onClick={toggleSubMenu}
                    key={i}
                    href={mi.link}
                    className="flex items-center gap-2.5 hover:underline"
                  >
                    {mi.name}
                    {/* <MdArrowOutward /> */}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* mobile view  */}
          {showNav ? (
            <button className="lg:hidden" onClick={() => setShowNav(!showNav)}>
              <CgClose className="text-2xl" />
            </button>
          ) : (
            <button className="lg:hidden" onClick={() => setShowNav(!showNav)}>
              <FaBars className="text-xl" />
            </button>
          )}

          {/* desktop mode login + contact buttons */}
          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated ? (
              /* ── User avatar + dropdown ── */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="flex items-center gap-2 rounded-full border border-[#e4e4e7] bg-white px-3 py-1.5 text-sm font-medium text-[#09090b] transition-all duration-200 hover:bg-[#f4f4f5]"
                >
                  {/* Avatar initials */}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </span>
                  <span className="max-w-30 truncate">{user?.name}</span>
                  <BiChevronDown
                    className={`text-lg text-[#71717a] transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[#e4e4e7] bg-white py-1 shadow-lg">
                    {/* User info header */}
                    <div className="border-b border-[#f4f4f5] px-4 py-3">
                      <p className="truncate text-sm font-semibold text-[#09090b]">
                        {user?.name}
                      </p>
                      <p className="truncate text-xs text-[#71717a]">
                        {user?.email}
                      </p>
                    </div>
                    {/* My Orders */}
                    <Link
                      href="/my-orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#09090b] transition-colors hover:bg-[#f4f4f5]"
                    >
                      My Orders
                    </Link>
                    <Link
                      onClick={() => setUserMenuOpen(false)}
                      href="https://shopadmin.bfinit.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#09090b] transition-colors hover:bg-[#f4f4f5]"
                    >
                      Store Panel
                      <ExternalLink
                        size={13}
                        className="text-muted-foreground"
                      />
                    </Link>
                    {/* Divider */}
                    <div className="my-1 border-t border-[#f4f4f5]" />
                    {/* Logout */}
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#ef4444] transition-colors hover:bg-[#fef2f2]"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`h-fit rounded-full border px-4 py-2 font-medium transition-all duration-300 ease-linear ${isScrolled || !isHome ? "border-brand/25 text-black hover:bg-gray-100" : "border-white/40 bg-white/20 text-black hover:bg-white/40"}`}
              >
                Login
              </Link>
            )}
            <Link
              href="/contact"
              className={`group flex h-fit items-center gap-2.5 rounded-full border px-4 py-2 font-medium shadow transition-all duration-300 ease-linear ${isScrolled || !isHome ? "border-brand/25 bg-[#242D2B] text-white hover:bg-[#090B0B]" : "border-transparent bg-white text-black hover:bg-softGray"}`}
            >
              Contact{" "}
              <MdArrowOutward className="duration-300 ease-linear group-hover:rotate-45" />
            </Link>
          </div>
        </section>
      </Container>

      {/* mobile view  */}
      {showNav && (
        <div className="top-14 absolute left-0 flex h-screen min-w-full flex-col gap-4 overflow-y-scroll bg-white p-5 md:px-14 lg:hidden">
          {updatedMenuItems.map((mi, i) => (
            <div key={i}>
              {mi.child ? (
                <div>
                  <div className="flex items-center justify-between text-[18px]">
                    {mi.name}
                    {showChild !== i ? (
                      <button
                        onClick={() => setShowChild(i)}
                        className="flex cursor-pointer items-center gap-1"
                      >
                        <BiChevronDown className="text-3xl" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowChild("")}
                        className="flex cursor-pointer items-center gap-1"
                      >
                        <BiChevronUp className="text-3xl" />
                      </button>
                    )}
                  </div>

                  {showChild === i && (
                    <div className="ml-2 mt-2 flex flex-col gap-4">
                      {mi.child.map((mc, i) => (
                        <div key={i}>
                          {mc.header ? (
                            <div>
                              <span className="font-semibold text-brand">
                                {mc.header}
                              </span>
                              <ul className="ml-2 mt-2 flex flex-col gap-2">
                                {mc.subChild.map((mcc, i) => (
                                  <Link
                                    key={i}
                                    href={mcc.link}
                                    onClick={() => setShowNav(!showNav)}
                                    className="flex gap-1.5 duration-300 ease-linear hover:translate-x-3 hover:font-semibold hover:text-brand"
                                  >
                                    <BiChevronRight className="text-2xl" />
                                    {mcc.name}
                                  </Link>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <Link
                              href={mc.link}
                              key={i}
                              onClick={() => setShowNav(!showNav)}
                              className="flex gap-1.5 duration-300 ease-linear hover:translate-x-3 hover:font-semibold hover:text-brand"
                            >
                              {mc.icon ? (
                                <Image
                                  width={1000}
                                  height={1000}
                                  src={mc.icon}
                                  className="size-8 rounded bg-blue-100 p-1"
                                  alt=""
                                />
                              ) : (
                                <BiChevronRight className="text-2xl" />
                              )}
                              <div>
                                <p className="">{mc.name}</p>
                                <p className="mt-1 text-xs text-gray-800">
                                  {mc.description}
                                </p>
                              </div>
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={mi.link}
                  key={i}
                  onClick={() => setShowNav(!showNav)}
                  className="flex items-center justify-between text-[18px]"
                >
                  {mi.name}
                  {/* <MdArrowOutward /> */}
                </Link>
              )}
            </div>
          ))}
          <div className="flex flex-col gap-3 mt-2">
            {isAuthenticated ? (
              <>
                <Link
                  href="/my-orders"
                  onClick={() => setShowNav(!showNav)}
                  className="w-full text-center rounded border border-brand px-4 py-2 text-brand shadow"
                >
                  My Orders
                </Link>
              </>
            ) : (
              <Link
                href={"/login"}
                onClick={() => setShowNav(!showNav)}
                className="w-full text-center rounded border border-brand px-4 py-2 text-brand shadow cursor-pointer"
              >
                Login
              </Link>
            )}
            <Link
              href={"/contact"}
              onClick={() => setShowNav(!showNav)}
              className="w-full text-center rounded bg-brand px-4 py-2 text-white shadow"
            >
              Contact Us
            </Link>
          </div>
          <div className="my-auto mb-12">
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  setShowNav(false);
                }}
                className="w-full font-bold flex gap-1 items-center justify-center text-center rounded border border-red-600 px-4 py-2 text-white bg-red-600 shadow cursor-pointer"
              >
                <LogOut size={20} /> Log out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
