"use client";

export const dynamic = "force-dynamic"; // ✅ SSR 오류 방지

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";

import DetailSwiper from "@/components/common/DetailSwiper";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import KakaoMap from "@/components/common/KakaoMap";
import DetailList from "@/components/travel/DetailList";
import { TourDetailInfo, TourImg, CatList } from "@/types/types";
import APIConnect from "@/utils/api";
import catListJson from "@/utils/catList.json";
import { getCookie, setCookie } from "@/utils/cookie";

const catList = catListJson as CatList;

// ✅ Suspense 적용하여 useSearchParams 안전하게 사용
export default function FestivalDetailPage() {
   return (
      <Suspense fallback={<div>Loading...</div>}>
         <FestivalDetailPageContent />
      </Suspense>
   );
}

function FestivalDetailPageContent() {
   const searchParams = useSearchParams(); // ✅ Suspense 내부에서 실행
   const [contentId, setContentId] = useState<number | null>(null);
   const [infoList, setInfoList] = useState<TourDetailInfo>();
   const [imgList, setImgList] = useState<TourImg[]>([]);
   const [isFavorite, setIsFavorite] = useState(false);
   const [isVisited, setIsVisited] = useState(false);

   useEffect(() => {
      const id = Number(searchParams.get("contentId"));
      if (!isNaN(id)) {
         setContentId(id);
      }
   }, [searchParams]);

   useEffect(() => {
      if (!contentId) return;

      const loadData = async () => {
         const info = await APIConnect.getFestivalInfo(contentId);
         const img = await APIConnect.getTourImg(contentId);

         setInfoList(info);
         setImgList(img);
      };

      loadData();

      // ✅ 쿠키에서 찜하기 & 방문한 관광지 데이터 읽어오기
      const favoritePlaces = JSON.parse(getCookie("favorites") || "[]");
      setIsFavorite(favoritePlaces.includes(key));

      const visitedPlaces = JSON.parse(getCookie("visited") || "[]");
      setIsVisited(visitedPlaces.includes(key));

      if (swiperRef.current && prevBtnRef.current && nextBtnRef.current) {
         swiperRef.current.params.navigation.prevEl = prevBtnRef.current;
         swiperRef.current.params.navigation.nextEl = nextBtnRef.current;
         swiperRef.current.navigation.init();
         swiperRef.current.navigation.update();
      }
   }, []);

   // ✅ 찜하기 토글 (쿠키에 저장)
   const handleFavoriteToggle = () => {
      let favoritePlaces = JSON.parse(getCookie("favorites") || "[]");

      if (isFavorite) {
         favoritePlaces = favoritePlaces.filter((id) => id !== key);
      } else {
         favoritePlaces.push(key);
      }

      setCookie("favorites", JSON.stringify(favoritePlaces), 7);
      setIsFavorite(!isFavorite);
   };

   // ✅ 다녀온 관광지 토글 (쿠키에 저장)
   const handleVisitedToggle = () => {
      let visitedPlaces = JSON.parse(getCookie("visited") || "[]");

      if (isVisited) {
         visitedPlaces = visitedPlaces.filter((id) => id !== key);
      } else {
         visitedPlaces.push(key);
      }

      setCookie("visited", JSON.stringify(visitedPlaces), 7);
      setIsVisited(!isVisited);
   };

   const parseAnchors = (htmlString: string) => {
      const anchorRegex = /<a\s+[^>]*href="([^"]+)"[^>]*title="([^"]*)"[^>]*>(.*?)<\/a>/g;
      const anchors = [];
      let match;
      while ((match = anchorRegex.exec(htmlString)) !== null) {
         const [_, href, title, content] = match;
         anchors.push({ href, title, content });
      }
      return anchors.map((anchor, idx) => (
         <div key={idx}>
            <a href={anchor.href} title={anchor.title} className="underline text-blue-600 hover:no-underline">
               {anchor.content}
            </a>
            <br />
         </div>
      ));
   };

   const convertBrToSpan = (htmlString: string) => {
      const parts = htmlString.split(/<br\s*\/?>/gi);
      return parts.map((part, idx) => <p key={idx}>{part}</p>);
   };

   // ✅ blankbox 변수를 다시 선언
   const blankbox = (
      <span className="bg-neutral-200 rounded px-24">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
   );

   return (
      <div className="min-h-screen">
         <Header />
         <main className="mx-auto max-w-screen-xl px-4 py-8">
            {/* 뒤로 가기 버튼 */}
            <div className="flex justify-start mb-4">
               <button className="flex items-center space-x-2" onClick={() => window.history.back()}>
                  <Image src="/images/goback.png" alt="뒤로 가기" width={16} height={16} />
                  <span className="text-sky-500 text-lg font-semibold">목록</span>
               </button>
            </div>

            {/* Title Section */}
            <div className="text-center">
               <h2 className="text-4xl font-bold text-neutral-800 mb-2">{infoList?.title || blankbox}</h2>
               <p className="text-xl font-normal text-neutral-800">
                  {infoList ? catList[infoList.cat3]?.cat2 + " · " + catList[infoList.cat3]?.cat3 : blankbox}
               </p>
            </div>

            {/* Image and Info */}
            <div className="flex gap-12 my-12">
               <DetailSwiper infoList={infoList} imgList={imgList} />

               <div className="flex flex-col justify-between max-w-[480] gap-12">
                  {/* Info Section */}
                  <div className="grid grid-cols-[auto_1fr] items-start gap-4">
                     <DetailList iconUrl={"/images/address.png"} title="주소">
                        {infoList ? infoList.addr : blankbox}
                     </DetailList>
                     <DetailList iconUrl={"/images/tel.png"} title="문의처">
                        {infoList ? infoList.infocenter : blankbox}
                     </DetailList>
                     <DetailList iconUrl={"/images/homepage.png"} title="홈페이지">
                        {infoList && infoList.homepage ? parseAnchors(infoList.homepage) : blankbox}
                     </DetailList>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center space-x-4">
                     {/* 다녀온 관광지 추가 버튼 */}
                     <button
                        className={`w-72 h-13 py-2 rounded-lg border ${
                           isVisited
                              ? "bg-gray-300 text-black"
                              : "bg-sky-500 text-white hover:bg-sky-600 border-sky-500"
                        }`}
                        onClick={handleVisitedToggle}>
                        <span className="font-semibold text-lg leading-7 tracking-normal">
                           {isVisited ? "다녀온 관광지" : "다녀온 관광지 추가"}
                        </span>
                     </button>

                     {/* 리뷰 작성 버튼 */}
                     <button className="w-52 h-13 bg-sky-50 py-2 px-4 rounded-lg border border-sky-500 hover:bg-sky-100">
                        <span className="font-semibold text-lg leading-7 tracking-normal text-sky-500">리뷰 작성</span>
                     </button>

                     {/* 찜하기 버튼 */}
                     <button
                        className="w-28 h-13 bg-sky-50 py-2 px-4 rounded-lg border border-sky-500 hover:bg-sky-100 flex items-center justify-center"
                        onClick={handleFavoriteToggle}>
                        <Image
                           src={isFavorite ? "/images/full_heart.png" : "/images/heart.png"}
                           alt="찜하기"
                           width={24}
                           height={24}
                        />
                        <span className="ml-2 font-semibold text-lg leading-7 tracking-normal text-sky-500">찜</span>
                     </button>
                  </div>
               </div>
            </div>

            {/* 운영 정보 */}
            <section className="">
               <h3 className="text-2xl font-bold mb-6">운영 정보</h3>
               {infoList ? (
                  <div className="grid grid-cols-[auto_1fr] items-start gap-y-5 gap-x-3">
                     {infoList.usetime && <DetailList title="운영시간">{convertBrToSpan(infoList.usetime)}</DetailList>}
                     {infoList.entranceFee && (
                        <DetailList title="입장료">{convertBrToSpan(infoList.entranceFee)}</DetailList>
                     )}
                  </div>
               ) : (
                  blankbox
               )}
            </section>

            <hr className="my-12" />

            {/* 행사 내용 추가 */}
            {infoList?.extraInfo?.map((exInfo) => {
               if (exInfo.infoname === "행사내용") {
                  return (
                     <section key={exInfo.serialnum} className="my-12">
                        <h3 className="text-2xl font-bold mb-6">{exInfo.infoname}</h3>
                        <div className="text-neutral-800 leading-relaxed text-lg">
                           {convertBrToSpan(exInfo.infotext)}
                        </div>
                     </section>
                  );
               }
               return null;
            })}

            {/* 소개 */}
            <section>
               <h3 className="text-2xl font-bold mb-6">소개</h3>
               <p className="text-neutral-800 leading-relaxed text-lg">{infoList?.overview || blankbox}</p>
            </section>

            <hr className="my-12" />

            {/* 위치 */}
            <section>
               <h3 className="text-2xl font-bold mb-6">위치</h3>
               {infoList?.mapx && infoList?.mapy ? (
                  <div className="h-[500]">
                     <KakaoMap mapx={infoList.mapx} mapy={infoList.mapy} title={infoList.title} />
                  </div>
               ) : (
                  "지도 정보 없음"
               )}
            </section>
         </main>
         <Footer />
      </div>
   );
}
