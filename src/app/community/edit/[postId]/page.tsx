"use client";

export const dynamic = "force-dynamic"; // ✅ 이 줄을 추가해서 SSR에서 오류 방지

import { AxiosResponse } from "axios";
import Image from "next/image";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import { checkAuthUser } from "@/utils/authapi";
import { getPostById, updatePost } from "@/utils/postapi";

interface Post {
   _id: string;
   title: string;
   content: string;
   fee: number | string;
   people: number;
   status: string;
   date: string;
   endDate: string;
   createdAt: string;
   image?: string;
   author: {
      _id: string;
      fullName: string;
      email: string;
   };
}

export default function EditPostPage() {
   const router = useRouter();
   const { postId } = useParams();
   const searchParams = useSearchParams();
   const channelId = searchParams.get("channelId") || "679f3aba7cd28d7700f70f40";
   const [post, setPost] = useState<Post | null>(null);
   const [title, setTitle] = useState<string>("");
   const [content, setContent] = useState<string>("");
   const [fee, setFee] = useState<number | "">("");
   const [people, setPeople] = useState<number>(1);
   const [date, setDate] = useState<string>("");
   const [endDate, setEndDate] = useState<string>("");
   const [image, setImage] = useState<File | null>(null);
   const [preview, setPreview] = useState<string | null>(null);
   const [loading, setLoading] = useState<boolean>(false);

   // 로그인 상태 확인
   useEffect(() => {
      const checkLogin = async () => {
         try {
            const response = await checkAuthUser();
            if (!response.data) {
               alert("로그인이 필요합니다.");
               router.push("/auth/login");
            }
         } catch (error) {
            console.error("로그인 확인 실패:", error);
            router.push("/auth/login");
         }
      };

      checkLogin(); // 로그인 상태 확인 함수 호출
   }, [router]);

   // 게시글 데이터 불러오기
   useEffect(() => {
      if (!postId) return;

      const fetchPostData = async () => {
         try {
            const response: AxiosResponse<Post> = await getPostById(postId as string);
            setPost(response.data);

            const parsedTitle = JSON.parse(response.data.title);

            setTitle(parsedTitle.title);
            setContent(parsedTitle.content);
            setFee(parsedTitle.fee);
            setPeople(parsedTitle.people);
            setDate(parsedTitle.date);
            setEndDate(parsedTitle.endDate);
            setPreview(response.data.image || "");
         } catch (error) {
            console.error("게시글 불러오기 실패:", error);
         }
      };
      fetchPostData();
   }, [postId]);

   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setImage(file);
         const objectUrl = URL.createObjectURL(file);
         setPreview(objectUrl);
      }
   };

   const getStatus = (endDate: string) => {
      const today = new Date();
      const end = new Date(endDate);
      return today > end ? "모집마감" : "모집중";
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log("channelId:", channelId);
      if (!title || !content || loading || fee === "" || !date || !endDate || !channelId) {
         alert("필수 항목을 모두 채워주세요.");
         return;
      }

      const status = getStatus(endDate);

      setLoading(true);
      try {
         const token = localStorage.getItem("accessToken");

         if (!token) {
            alert("로그인이 필요합니다.");
            router.push("/auth/login");
            return;
         }

         const imageToDeletePublicId = null;

         // 수정된 게시글 데이터를 업데이트
         const response = await updatePost(
            postId as string,
            title,
            content,
            fee,
            people,
            status,
            date,
            endDate,
            image,
            imageToDeletePublicId,
            channelId,
            token,
         );
         if (response.status === 200) {
            alert("게시글이 수정되었습니다.");
            router.push(`/community/post/${postId}`);
         } else {
            throw new Error("게시글 수정 실패");
         }
      } catch (error) {
         console.error("게시글 수정 실패:", error);
         alert("게시글 수정에 실패했습니다.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen flex flex-col bg-gray-50">
         <Header />
         <div className="relative mb-10">
            <div className="min-h-[160px] bg-[url('/images/community/banner_together.png')] bg-cover bg-center">
               <div className="relative flex flex-col justify-center gap-10 min-h-[160px]">
                  <div className="text-white text-center">
                     <h2 className="font-semibold mt-15 leading-loose">
                        <span className="text-3xl block mb-5">함께하는 여행, 특별한 동행</span>
                        <span className="text-4xl block">강원도 여행 동행 모집</span>
                     </h2>
                  </div>
               </div>
            </div>
         </div>
         <div className="max-w-4xl w-full mx-auto px-6 py-10 bg-white rounded-lg shadow-md mb-10 border">
            {post ? (
               <>
                  {/* 제목, 내용 수정 폼 */}
                  <div className="mb-6">
                     <label className="block text-lg font-semibold">제목 *</label>
                     <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                     />
                  </div>
                  <div className="mb-6">
                     <label className="block text-lg font-semibold">내용 *</label>
                     <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md h-60"
                     />
                  </div>
                  <div className="mb-6">
                     <label className="block text-lg font-semibold">참여 요금 *</label>
                     <input
                        type="number"
                        value={fee}
                        onChange={(e) => setFee(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-md"
                     />
                  </div>
                  <div className="mb-6">
                     <label className="block text-lg font-semibold">인원 수 *</label>
                     <input
                        type="number"
                        value={people}
                        onChange={(e) => setPeople(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-md"
                     />
                  </div>
                  <div className="mb-6">
                     <label className="block text-lg font-semibold">여행 일자 *</label>
                     <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                     />
                  </div>
                  <div className="mb-6">
                     <label className="block text-lg font-semibold">모집 마감일 *</label>
                     <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                     />
                  </div>
                  <div className="mb-6">
                     <label className="block text-lg font-semibold">사진 첨부 (선택)</label>
                     <input
                        type="file"
                        onChange={handleImageUpload}
                        className="w-full p-3 border border-gray-300 rounded-md"
                     />
                     {preview && <Image src={preview} alt="미리보기" width={300} height={200} className="mt-2" />}
                  </div>

                  {/* 수정 완료 버튼 */}
                  <button
                     onClick={handleSubmit}
                     disabled={loading || !title || !content || !fee || !people || !date || !endDate || !channelId}
                     className={`w-full p-4 mt-2 text-lg font-semibold rounded-md ${
                        loading ? "bg-gray-300 cursor-not-allowed" : "bg-sky-500 text-white"
                     }`}>
                     {loading ? "수정 중..." : "수정 완료"}
                  </button>
               </>
            ) : (
               <p className="text-center">게시글을 불러오는 중...</p>
            )}
         </div>
         <Footer />
      </div>
   );
}
