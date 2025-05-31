import React from "react";
import { FiUser } from "react-icons/fi";
import { BsLungs } from "react-icons/bs";
import { TbReport } from "react-icons/tb";
import { MdPriorityHigh } from "react-icons/md";
import { MdOutlineCheck } from "react-icons/md";

const Metrics = ({ patientCount, xrayCount, normalCount, abnormalCount }) => {
  return (
    <div className="p-4">
      <p className="text-xl font-semibold mb-2 text-[#fdfdfd] dark:text-[#030811]">Metrics</p>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card
          title="Patients"
          subtitle="Total Patients"
          number={patientCount}
          Icon={FiUser}
        />
        <Card
          title="Xrays"
          subtitle="Total X-rays"
          number={xrayCount}
          Icon={BsLungs}
        />
        <Card
          title="Abnormal X-rays"
          subtitle="Total Abnormal X-rays"
          number={abnormalCount}
          Icon={MdPriorityHigh}
        />
        <Card
          title="Normal X-rays"
          subtitle="Total Normal X-rays"
          number={normalCount}
          Icon={MdOutlineCheck}
        />
      </div>
    </div>
  );
};

const Card = ({ title, subtitle, Icon, number }) => {
  return (
    <button className="w-full p-4 rounded border-[1px] border-gray-800 dark:border-slate-300 relative overflow-hidden group bg-black dark:bg-white">
      <div className="absolute inset-0 bg-gradient-to-r from-[#030811] to-[#5c60c6] translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />

      <Icon className="absolute z-10 -top-12 -right-12 text-9xl text-slate-100 group-hover:text-violet-400 group-hover:rotate-12 transition-transform duration-300" />
      <div className="relative z-10">
        <Icon className="mb-2 text-2xl text-[#5c60c6] group-hover:text-white transition-colors duration-300" />
        <h3 className="font-medium text-lg text-[#fdfdfd] dark:text-[#030811] group-hover:text-white duration-300">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-slate-500 group-hover:text-violet-200 duration-300">
            {subtitle}
          </p>
          <span className="text-3xl font-bold text-[#5c60c6] group-hover:text-white transition-colors duration-300">
            {number}
          </span>
        </div>
      </div>
    </button>
  );
};

export default Metrics;
