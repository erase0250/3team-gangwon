// 식당 페이지

"use client";

export const dynamic = "force-dynamic"; // ✅ 이 줄을 추가해서 SSR에서 오류 방지

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import PlaceCardList from "@/components/places/PlaceCardList";
import PlcaeDetailBar from "@/components/places/PlaceDetailBar";
import PlaceSearchBar from "@/components/places/PlaceSearchBar";
import { PlaceParam } from "@/types/types";

export default function Restaurants() {
   type ExtraType = {
      detail?: string;
      keyword?: string;
   };

   // 라우터 세팅
   const searchParams = useSearchParams();
   const router = useRouter();

   // 파라미터 가져오기
   const nowCategory = searchParams.get("cat");
   const nowFilter = searchParams.get("filter");
   const nowPage = Number(searchParams.get("page"));
   const nowDetail = searchParams.get("detail");
   const nowKeyword = searchParams.get("keyword");
   const [selected, setSelected] = useState<PlaceParam & ExtraType>({ cat: "", page: 1 });

   // URL 변경 함수 (props로 전달)
   const handleUrlChange = (selectedParam: PlaceParam & ExtraType) => {
      let queryString = `?cat=${selectedParam.cat}&page=${selectedParam.page}`;
      if (selectedParam.filter) {
         queryString += `&filter=${selectedParam.filter}`;
      }
      if (selectedParam.detail) {
         queryString += `&detail=${selectedParam.detail}`;
      }
      if (selectedParam.keyword) {
         queryString += `&keyword=${encodeURI(selectedParam.keyword)}`;
      }
      router.push(queryString, { scroll: false });
      setSelected(selectedParam);
   };

   // 기본 파라미터 설정 (cat이 없을 경우 restaurants으로 설정)
   useEffect(() => {
      if (!nowCategory) {
         setSelected({ cat: "restaurants", page: 1 });
         router.push("?cat=restaurants&page=1", { scroll: false });
         return;
      }

      // 올바른 카테고리 값인지 확인 후 설정
      if (["restaurants", "accommodations"].includes(nowCategory)) {
         setSelected({
            cat: nowCategory,
            filter: nowFilter,
            page: nowPage || 1,
            detail: nowDetail || "",
            keyword: nowKeyword || "",
         });
      }
   }, [nowCategory, nowFilter, nowPage, nowDetail, nowKeyword, router]);

   return (
      <div>
         <Header />
         <div className="h-[480px] py-20 bg-[url(/images/places/banner_eat.png)] bg-cover">
            <div className="relative flex flex-col justify-center gap-10">
               <div className=" text-white text-center">
                  <h2 className="text-4xl font-bold mt-20 leading-normal">
                     완벽한 여행 계획을 위해 <br /> 강원도만의 맛집과 숙소를 만나보세요.
                  </h2>
               </div>
               <PlaceSearchBar selected={selected} changeUrl={handleUrlChange} />
            </div>
         </div>

         <PlcaeDetailBar selected={selected} changeUrl={handleUrlChange} />
         <PlaceCardList
            key={`${selected.cat ?? "restaurants"}-${selected.page ?? 1}-${selected.filter ?? "nofilter"}-${
               selected.detail ?? "nodetail"
            }`}
            selected={selected}
            changeUrl={handleUrlChange}
         />

         <Footer />
      </div>
   );
}
