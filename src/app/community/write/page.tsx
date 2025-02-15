"use client";

export const dynamic = "force-dynamic"; // ✅ 이 줄을 추가해서 SSR에서 오류 방지

import { AxiosResponse, AxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import { createPost } from "@/utils/postapi";

export default function WritePage() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const channelId = searchParams.get("channelId") || "679f3aba7cd28d7700f70f40";
   const [title, setTitle] = useState("");
   const [content, setContent] = useState("");
   const [fee, setFee] = useState<number | "">("");
   const [people, setPeople] = useState<number>(1);
   const [date, setDate] = useState<string>("");
   const [endDate, setEndDate] = useState<string>("");
   const [image, setImage] = useState<File | null>(null);
   const [preview, setPreview] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
         alert("로그인이 필요합니다.");
         router.push("/auth/login");
      }
   }, [router]);

   // 이미지 업로드 처리
   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setImage(file);
         const objectUrl = URL.createObjectURL(file);
         setPreview(objectUrl);
      }
   };

   // 참여 요금 처리
   const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (/^\d*$/.test(value)) {
         setFee(value === "" ? "" : Number(value));
      }
   };

   // 인원 수 증가/감소
   const handlePeopleIncrease = () => {
      setPeople((prevPeople) => prevPeople + 1);
   };

   const handlePeopleDecrease = () => {
      if (people > 1) {
         setPeople((prevPeople) => prevPeople - 1);
      }
   };

   // 날짜 입력 처리
   const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDate(e.target.value);
   };

   // 모집 마감일 입력 처리
   const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEndDate(e.target.value);
   };

   // 모집 상태 자동 설정 함수
   const getStatus = (endDate: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      if (today > end) {
         return "모집마감";
      } else {
         return "모집중";
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title || !content || loading || fee === "" || !date || !endDate) return;

      const status = getStatus(endDate);

      setLoading(true);
      try {
         const token = localStorage.getItem("accessToken");
         if (!token) throw new Error("로그인이 필요합니다.");

         const response: AxiosResponse<{ _id: string }> = await createPost(
            title,
            image,
            channelId,
            content,
            fee,
            people,
            status,
            date,
            endDate,
            token,
         );
         console.log("📌 서버 응답:", response.data);

         if (response.data && response.data._id) {
            alert("글이 성공적으로 작성되었습니다.");
            setTitle("");
            setContent("");
            setFee("");
            setPeople(1);
            setDate("");
            setEndDate("");
            setImage(null);
            setPreview(null);

            router.push(`/community/post/${response.data._id}`);
         } else {
            throw new Error("게시글 ID를 찾을 수 없습니다.");
         }
      } catch (error) {
         const axiosError = error as AxiosError<{ message?: string }>;
         console.error("❌ 오류:", axiosError);
         alert(axiosError.response?.data?.message || axiosError.message || "게시글 작성 중 오류가 발생했습니다.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen flex flex-col">
         <Header />
         <div className="min-h-[160px] py-20 bg-[url(/images/community/banner_together.png)] bg-cover">
            <div className="relative flex flex-col justify-center gap-10">
               <div className="text-white ml-12">
                  <h2 className="font-bold mt-20 leading-loose">
                     <span className="text-3xl block mb-5">설레는 동행과 특별한 이야기가 머무는 곳</span>
                     <span className="text-4xl block">동행 모집 작성</span>
                  </h2>
               </div>
            </div>
         </div>
         <div className="max-w-[800px] w-full mx-auto mt-16 p-6 bg-white shadow-lg rounded-lg mb-16 border">
            <button onClick={() => router.back()} className="mb-4 text-blue-500 hover:underline">
               ◀ 게시글 목록
            </button>
            <div className="mb-4">
               <label className="block text-lg font-semibold">제목 *</label>
               <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
               />
            </div>
            <div className="mb-4">
               <label className="block text-lg font-semibold">내용 *</label>
               <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md h-60"
                  required
               />
            </div>
            <div className="mb-4">
               <label className="block text-lg font-semibold">참여 요금 *</label>
               <input
                  type="text"
                  value={fee}
                  onChange={handleFeeChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
               />
            </div>
            <div className="mb-4">
               <label className="block text-lg font-semibold">인원 수 *</label>
               <div className="flex items-center space-x-4">
                  <button
                     type="button"
                     onClick={handlePeopleDecrease}
                     className="w-10 h-10 text-white bg-sky-300 rounded-full text-xl flex items-center justify-center">
                     -
                  </button>
                  <span className="text-lg font-semibold">{people}</span>
                  <button
                     type="button"
                     onClick={handlePeopleIncrease}
                     className="w-10 h-10 text-white bg-sky-300 rounded-full text-xl flex items-center justify-center">
                     +
                  </button>
                  <span className="text-lg font-semibold">명</span>
               </div>
            </div>
            <div className="mb-4">
               <label className="block text-lg font-semibold">여행 일자 *</label>
               <input
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
               />
            </div>
            <div className="mb-4">
               <label className="block text-lg font-semibold">모집 마감일 *</label>
               <input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
               />
            </div>
            <div className="mb-4">
               <label className="block text-lg font-semibold">사진 첨부 (선택)</label>
               <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2 border border-gray-300 rounded-md"
               />
               {preview && (
                  <div className="mt-2">
                     <img src={preview} alt="미리보기" className="mt-2 w-[full] h-38 object-cover rounded-md" />
                  </div>
               )}
            </div>
            <button
               onClick={handleSubmit}
               disabled={!title || !content || !fee || !people || !date || !endDate || loading}
               className={`w-full p-4 text-lg font-semibold rounded-md ${
                  loading ? "bg-gray-300 cursor-not-allowed" : "bg-sky-500 text-white"
               }`}>
               {loading ? "작성 중..." : "작성 완료"}
            </button>
         </div>
         <Footer />
      </div>
   );
}
