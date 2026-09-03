"use client";
import { useEffect, useState } from "react";
import { MdEmail } from "react-icons/md";
import animData from "../../assets/contact-anim.json";

import Container from "../shared/Container";
import { smtpexpressClient } from "../smtp";

import { useRouter } from "next/navigation";
import Form from "./Form";
import { BiHome, BiPhone } from "react-icons/bi";

export default function Contact() {
  const navigate = useRouter();

  return (
    <Container>
      <section className="py-10 md:py-28">
        <div className="grid gap-8 md:gap-16 lg:grid-cols-2">
          <div className="flex flex-col gap-4 md:gap-8">
            <h5 className="font-semibold md:text-2xl">Contact Us</h5>
            <p className="text-xl font-semibold font-inter text-balance text-brand md:text-3xl">
              To make requests for further information, contact us via our
              social channels.{" "}
            </p>
            <div className="flex gap-5">
              <div className="flex h-fit w-fit items-center justify-center rounded-xl bg-gray-100 p-4 text-brand shadow">
                <BiHome className="text-xl md:text-2xl" />
              </div>
              <div className="flex flex-col gap-2">
                <h5 className="font-semibold">Address</h5>
                <p>8 rue de Dublin, 34200, Sète, France</p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="flex h-fit w-fit items-center justify-center rounded-xl bg-gray-100 p-4 text-brand shadow">
                <BiPhone className="text-xl md:text-2xl" />
              </div>
              <div className="flex flex-col gap-2">
                <h5 className="font-semibold">Phone</h5>
                <p>+0033666100010</p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="flex h-fit w-fit items-center justify-center rounded-xl bg-gray-100 p-4 text-brand shadow">
                <MdEmail className="text-xl md:text-2xl" />
              </div>
              <div className="flex flex-col gap-2">
                <h5 className="font-semibold">Email</h5>
                <p>support@bobosohomail.com</p>
                <p>bfin@bobosohomail.com</p>
              </div>
            </div>
          </div>
          <div className="">{/* <Lottie options={defaultOptions} /> */}</div>
        </div>

        <h5 className="mt-10 text-end font-semibold md:mt-20 md:text-2xl">
          Send Message
        </h5>
        <p className="mt-4 text-end text-xl font-semibold text-brand md:mt-8 md:text-3xl">
          Get in touch
        </p>

        <div className="mt-10 grid gap-8 md:mt-20 md:gap-16 lg:grid-cols-2">
          <Form />

          <div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d5795.795980198256!2d3.708454!3d43.420958!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12b1357c2efa6fbb%3A0xddfc93666aef9f37!2s8%20Rue%20de%20Dublin%2C%2034200%20S%C3%A8te%2C%20France!5e0!3m2!1sen!2sbd!4v1723619506631!5m2!1sen!2sbd"
              width="100%"
              height="100%"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </Container>
  );
}
