import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@getpara/react-sdk", "@getpara/*"],
};


export default nextConfig;
