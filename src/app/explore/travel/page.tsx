"use client";

export const dynamic = "force-dynamic"; // ✅ 이 줄을 추가해서 SSR에서 오류 방지

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import CardList from "@/components/common/CardList";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import TourSearchBar from "@/components/travel/TourSearchBar";
import { SelectedParam } from "@/types/types";

const TravelPage: React.FC = () => {
   // 라우터 세팅
   const searchParams = useSearchParams();
   const router = useRouter();

   // 파라미터 가져오기
   const nowCategory = searchParams.get("cat");
   const nowFilter = searchParams.get("filter");
   const nowPage = Number(searchParams.get("page")) || 1;
   const [selected, setSelected] = useState<SelectedParam>({ cat: "", page: 1 });

   // URL 변경 함수 (props로 전달)
   const handleUrlChange = (selectedParam: SelectedParam) => {
      let queryString = `?cat=${selectedParam.cat}&page=${selectedParam.page}`;
      if (selectedParam.filter) {
         queryString += `&filter=${selectedParam.filter}`;
      }
      router.replace(queryString, { scroll: false });
      setSelected(selectedParam);
   };

   // 기본 파라미터 설정 (cat이 없을 경우 season으로 설정)
   useEffect(() => {
      if (!nowCategory) {
         console.log("🔄 기본 카테고리 'season' 적용");
         setSelected({ cat: "season", page: 1 });
         router.replace("?cat=season&filter=spring&page=1", { scroll: false });
         return;
      }

      // 올바른 카테고리 값인지 확인 후 설정
      if (["season", "region", "nature", "culture"].includes(nowCategory)) {
         setSelected({ cat: nowCategory, filter: nowFilter, page: nowPage || 1 });
      }
   }, [nowCategory, nowFilter, nowPage]);

   return (
      <div className="min-h-screen">
         <Header />
         <TourSearchBar selected={selected} changeUrl={handleUrlChange} />
         <CardList
            key={`${selected.cat}-${selected.page}-${selected.filter}`}
            selected={selected}
            changeUrl={handleUrlChange}
         />

         <Footer />
      </div>
   );
};

export default TravelPage;
