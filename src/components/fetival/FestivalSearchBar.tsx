export const dynamic = "force-dynamic"; // ✅ 이 줄을 추가해서 SSR에서 오류 방지

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { SelectedParam } from "@/types/types";
import regionList from "@/utils/regionList.json";

// 축제 = a0207
// 공연/행사 = a0208
const categories = [
   { name: "전체", value: "total" },
   { name: "축제", value: "festival" },
   { name: "공연/행사", value: "event" },
];

type ExtraSearchBarProps = {
   selected: SelectedParam & ExtraType;
   changeUrl: (url: SelectedParam & ExtraType) => void;
};
type ExtraType = {
   month?: string;
   keyword?: string;
};

const FestivalSearchBar: React.FC<ExtraSearchBarProps> = ({ selected, changeUrl }) => {
   const searchRef = useRef<HTMLInputElement>(null);
   const searchParams = useSearchParams();

   useEffect(() => {
      const monthFromUrl = searchParams.get("month");
      const filterFromUrl = searchParams.get("filter");

      if (monthFromUrl || filterFromUrl) {
         changeUrl({
            ...selected,
            month: monthFromUrl || selected.month,
            filter: filterFromUrl || selected.filter,
         });
      }
   }, [searchParams]);
   const handleSearch = () => {
      if (searchRef.current) {
         changeUrl({ ...selected, keyword: searchRef.current.value });
      }
   };

   return (
      <div className="mx-auto  p-7 shadow-xl bg-white rounded-lg">
         <div className="flex flex-wrap justify-between gap-4">
            {" "}
            {/* 카테고리 선택 */}
            <div className="flex gap-x-6 font-bold text-xl items-start">
               {categories.map((category) => (
                  <button
                     key={category.value}
                     onClick={() => {
                        changeUrl({ cat: category.value, page: 1, keyword: "" });

                        if (searchRef.current) {
                           searchRef.current.value = ""; // 검색창 초기화
                        }
                     }}
                     className={`hover:text-sky-500 ${selected.cat === category.value ? "text-sky-500" : ""}`}>
                     {category.name}
                  </button>
               ))}
            </div>
            {/* 검색 바 */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
               {" "}
               <div className="relative flex items-center">
                  <input
                     ref={searchRef}
                     type="text"
                     placeholder="검색어를 입력해 주세요."
                     className="text-lg placeholder:text-base w-72 px-4 py-2 border border-sky-500 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                     onKeyDown={(e) => {
                        if (e.key === "Enter") {
                           handleSearch();
                        }
                     }}
                  />
                  <i className="bi bi-search text-sky-500 absolute right-3 top-1/2 transform -translate-y-1/2 text-lg"></i>
               </div>
               <button
                  className="h-full px-5 text-white bg-sky-500 text-sm font-medium rounded-lg"
                  onClick={handleSearch}>
                  검색
               </button>
            </div>
         </div>

         <div className="flex mt-2 gap-4">
            {/* 지역 필터 */}
            <div className="w-full sm:w-[180px]">
               {" "}
               <p className="text-neutral-500 text-lg pb-2">지역</p>
               <select
                  className="w-full bg-transparent focus:outline-none border-b border-sky-500 text-lg pb-2 text-neutral-800"
                  value={selected.filter ? selected.filter : ""}
                  onChange={(e) => {
                     changeUrl({ ...selected, filter: e.target.value });
                  }}>
                  <option value="">전체</option>
                  {regionList.map((region) => (
                     <option key={region.code} value={region.code}>
                        {region.name}
                     </option>
                  ))}
               </select>
            </div>

            {/* 날짜 필터 */}
            <div className="w-full sm:w-[150px]">
               <p className="text-neutral-500 text-lg pb-2">날짜</p>
               <select
                  className="w-full bg-transparent focus:outline-none border-b border-sky-500 text-lg pb-2 text-neutral-800"
                  value={selected.month || ""}
                  onChange={(e) => {
                     changeUrl({ ...selected, month: e.target.value });
                  }}>
                  <option value="">전체</option>
                  {[...Array(12)].map((_, i) => (
                     <option key={i} value={(i + 1).toString().padStart(2, "0")}>
                        {i + 1}월
                     </option>
                  ))}
               </select>
            </div>
         </div>
      </div>
   );
};

export default FestivalSearchBar;
