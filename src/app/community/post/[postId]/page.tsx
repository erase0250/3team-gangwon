"use client";

export const dynamic = "force-dynamic"; // ✅ SSR 오류 방지

import { AxiosResponse, AxiosError } from "axios";
import Image from "next/image";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import { checkAuthUser } from "@/utils/authapi";
import { getPostById, deletePost, createComment, deleteComment } from "@/utils/postapi";

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
      username: string;
      email: string;
   };
   comments?: CommentResponse[];
   channelId?: string;
}

interface CommentResponse {
   _id: string;
   author: { _id: string; fullName: string; username: string; image: string };
   comment: string;
   createdAt: string;
}

// ✅ Suspense 적용하여 useSearchParams 안전하게 사용
export default function PostDetail() {
   return (
      <Suspense fallback={<div>Loading...</div>}>
         <PostDetailContent />
      </Suspense>
   );
}

function PostDetailContent() {
   const router = useRouter();
   const params = useParams();
   const postId = params?.postId as string;
   const searchParams = useSearchParams();
   const channelId = searchParams.get("channelId") || "679f3aba7cd28d7700f70f40";

   const [post, setPost] = useState<Post | null>(null);
   const [loading, setLoading] = useState(true);
   const [isAuthor, setIsAuthor] = useState(false);
   const [comments, setComments] = useState<CommentResponse[]>([]);
   const [commentContent, setCommentContent] = useState<string>("");

   useEffect(() => {
      if (typeof window !== "undefined") {
         const token = localStorage.getItem("accessToken");

         if (token) {
            const fetchUserData = async () => {
               try {
                  const response = await checkAuthUser();
                  if (response.data) {
                     const currentUserId = response.data._id;
                     if (currentUserId && post?.author._id === currentUserId) {
                        setIsAuthor(true);
                     }
                  }
               } catch (error) {
                  console.error("로그인 확인 실패:", error);
               }
            };
            fetchUserData();
         }
      }
   }, [post]);

   // 게시글 데이터, 댓글 가져오기
   useEffect(() => {
      if (!postId) return;

      const fetchPost = async () => {
         try {
            const response: AxiosResponse<Post> = await getPostById(postId);
            setPost(response.data);
            setComments(response.data.comments || []); // 댓글 가져오기
         } catch (error) {
            console.error("❌ 게시글 불러오기 실패:", error);
         } finally {
            setLoading(false);
         }
      };
      fetchPost();
   }, [postId]);

   const formatDate = (date: string | undefined) => {
      if (!date) return "날짜 정보 없음";
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? "유효하지 않은 날짜" : parsedDate.toLocaleDateString();
   };

   const parseTitle = (title: string) => {
      try {
         return JSON.parse(title);
      } catch (error) {
         console.error("Error parsing title:", error);
         return {
            title: "제목 없음",
            content: "내용 없음",
            fee: "정보 없음",
            people: 1,
            status: "정보 없음",
            date: "",
            endDate: "",
         };
      }
   };

   const parsedTitle = post ? parseTitle(post.title) : null;

   const getFieldValue = (value: string | number | undefined, fallback: string | number = "정보 없음") => {
      if (value === undefined || value === null || value === "") return fallback;
      return value;
   };

   const handleDelete = async () => {
      if (!post) return;

      const confirmDelete = window.confirm("정말로 이 게시글을 삭제하시겠습니까?");
      if (!confirmDelete) return;

      try {
         const token = localStorage.getItem("accessToken");
         if (!token) {
            alert("로그인이 필요합니다.");
            return;
         }

         const response = await deletePost(post._id, token);

         if (response.status === 200) {
            alert("게시글이 삭제되었습니다.");
            router.push("/community");
         } else {
            alert("게시글 삭제에 실패했습니다.");
         }
      } catch (error) {
         console.error("❌ 게시글 삭제 실패:", error);
         alert("게시글 삭제에 실패했습니다.");
      }
   };

   const handleCommentSubmit = async () => {
      if (commentContent.trim()) {
         const token = localStorage.getItem("accessToken");

         if (!token) {
            alert("로그인이 필요합니다.");
            router.push("/auth/login");
            return;
         }

         try {
            // 댓글 작성 API 호출
            const response: AxiosResponse<CommentResponse> = await createComment(commentContent, postId, token);

            if (!response.data) {
               alert("댓글 저장에 실패했습니다.");
               return;
            }

            setCommentContent("");

            setComments((prevComments) => [
               ...prevComments,
               {
                  _id: response.data._id,
                  author: {
                     _id: response.data.author._id,
                     fullName: response.data.author.fullName,
                     username: response.data.author.username,
                     image: response.data.author.image || "",
                  }, // 댓글 작성자 정보
                  comment: response.data.comment,
                  createdAt: response.data.createdAt,
               },
            ]);
         } catch (error) {
            console.error("❌ 댓글 작성 실패:", error);
            alert("댓글 작성에 실패했습니다.");
         }
      } else {
         alert("댓글 내용을 입력해주세요.");
      }
   };

   // 댓글 삭제
   const handleDeleteComment = async (commentId: string, authorId: string) => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
         alert("로그인이 필요합니다.");
         return;
      }

      // 현재 로그인된 사용자 ID를 가져옴
      const storedUserId = localStorage.getItem("userId");

      if (!storedUserId) {
         alert("사용자 정보가 없습니다.");
         return;
      }

      const currentUserId = storedUserId;

      if (authorId !== currentUserId) {
         alert("본인이 작성한 댓글만 삭제할 수 있습니다.");
         return;
      }

      const confirmDelete = window.confirm("정말로 이 댓글을 삭제하시겠습니까?");
      if (!confirmDelete) return;

      try {
         const response = await deleteComment(commentId, token);

         if (response.status === 200) {
            setComments((prevComments) => prevComments.filter((comment) => comment._id !== commentId));
         } else {
            alert("댓글 삭제에 실패했습니다.");
         }
      } catch (error) {
         if (error instanceof AxiosError) {
            console.error("❌ 댓글 삭제 실패:", error.response ? error.response.data : error.message);
         } else {
            console.error("❌ 댓글 삭제 실패:", error);
         }
         alert("댓글 삭제에 실패했습니다.");
      }
   };

   return (
      <div className="min-h-screen flex flex-col bg-gray-50">
         <Header />
         <div className="min-h-[160px] mb-10 py-20 bg-[url(/images/community/banner_together.png)] bg-cover">
            <div className="relative flex flex-col justify-center gap-10 min-h-[160px]">
               <div className="text-white ml-12">
                  <h2 className="font-bold mt-20 text-center">
                     <span className="text-3xl block mb-5">함께하는 여행, 특별한 동행</span>
                     <span className="text-4xl block">강원도 여행 동행 모집</span>
                  </h2>
               </div>
            </div>
         </div>
         <div className="max-w-4xl w-full mx-auto px-6 py-10 bg-white rounded-lg shadow-md mb-10 border">
            {loading ? (
               <p className="text-gray-500 text-center">게시글을 불러오는 중...</p>
            ) : post ? (
               <>
                  {/* 제목, 작성자 정보, 작성일 */}
                  <div className="flex justify-between items-center mb-6">
                     <h1 className="text-3xl font-semibold text-gray-800">
                        {parsedTitle ? parsedTitle.title : "제목 없음"}
                     </h1>
                  </div>
                  {/* 작성자 정보 */}
                  <div className="text-gray-500 text-sm mb-4">
                     <p>
                        <strong>작성자 : </strong> {post.author.username || post.author.fullName} ({post.author.email})
                     </p>{" "}
                  </div>
                  {/* 게시글 작성일 */}
                  <div className="text-gray-500 text-sm mb-6">
                     <p>
                        <strong>작성일 : </strong> {formatDate(post.createdAt)}
                     </p>
                  </div>
                  {/* 이미지 & 정보 섹션 */}
                  <div className="flex flex-wrap md:flex-nowrap gap-6 mb-8">
                     {/* 이미지 */}
                     <div className="w-full md:w-[40%] h-[300px] overflow-hidden rounded-lg">
                        <Image
                           src={post.image || "/images/no_img.jpg"}
                           alt={parsedTitle ? parsedTitle.title : "게시글 이미지"}
                           width={600}
                           height={400}
                           className="w-full h-full object-cover rounded-lg"
                        />
                     </div>

                     {/* 모집 정보 */}
                     <div className="w-full md:w-[55%] space-y-6">
                        <div className="mt-8 flex justify-between items-center text-gray-900 font-semibold">
                           <span className="flex items-center space-x-2">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 strokeWidth="1.5"
                                 stroke="currentColor"
                                 className="size-6">
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                 />
                              </svg>

                              <span>참여 요금</span>
                           </span>
                           <span>{getFieldValue(parsedTitle?.fee, "무료")} ₩</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-900 font-semibold">
                           <span className="flex items-center space-x-2">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 strokeWidth="1.5"
                                 stroke="currentColor"
                                 className="size-6">
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                 />
                              </svg>

                              <span>인원 수</span>
                           </span>
                           <span>{getFieldValue(parsedTitle?.people, 1)} 명</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-900 font-semibold">
                           <span className="flex items-center space-x-2">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 strokeWidth="1.5"
                                 stroke="currentColor"
                                 className="size-6">
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                 />
                              </svg>

                              <span>모집 상태</span>
                           </span>
                           <span
                              className={`${
                                 parsedTitle?.status === "모집중"
                                    ? "bg-sky-50 text-sky-500"
                                    : parsedTitle?.status === "모집마감"
                                    ? "bg-red-100 text-red-500"
                                    : "bg-gray-200 text-gray-500"
                              } font-semibold px-3 py-1 rounded-md`}>
                              {parsedTitle?.status}
                           </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-900 font-semibold">
                           <span className="flex items-center space-x-2">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 strokeWidth="1.5"
                                 stroke="currentColor"
                                 className="size-6">
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                                 />
                              </svg>

                              <span>여행 일자</span>
                           </span>
                           <span>{formatDate(parsedTitle?.date)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-900 font-semibold">
                           <span className="flex items-center space-x-2">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 strokeWidth="1.5"
                                 stroke="currentColor"
                                 className="size-6">
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
                                 />
                              </svg>

                              <span>모집 마감일</span>
                           </span>
                           <span>{formatDate(parsedTitle?.endDate)}</span>
                        </div>
                     </div>
                  </div>
                  {/* 본문 내용 */}
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line mb-12">
                     {parsedTitle ? parsedTitle.content : post.content}
                  </div>
                  <div className="flex justify-end items-center mb-4">
                     {/* 수정, 삭제 버튼 (작성자만 보이게) */}
                     {isAuthor && (
                        <div className="flex gap-4">
                           <button
                              onClick={() => router.push(`/community/edit/${post._id}?channelId=${channelId}`)} // 수정 페이지로 이동
                              className="bg-transparent border-2 border-sky-500 text-sky-500 px-4 py-2 rounded-lg shadow hover:bg-sky-500 hover:text-white transition flex items-center space-x-2">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 strokeWidth="1.5"
                                 stroke="currentColor"
                                 className="size-6">
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                 />
                              </svg>

                              <span>수정</span>
                           </button>

                           <button
                              onClick={handleDelete}
                              className="bg-transparent border-2 border-red-500 text-red-500 px-4 py-2 rounded-lg shadow hover:bg-red-500 hover:text-white transition flex items-center space-x-2">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="w-5 h-5"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor">
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                 />
                              </svg>
                              <span>삭제</span>
                           </button>
                        </div>
                     )}
                  </div>
                  <hr className="my-8 border-b border-gray-300  " />
                  <div className="flex justify-end mb-8 mr-2">
                     <button
                        onClick={() => router.push("/community")}
                        className="transition-all duration-300 flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-md shadow-md hover:bg-gray-600">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           fill="none"
                           viewBox="0 0 24 24"
                           strokeWidth="2"
                           stroke="currentColor"
                           className="w-7 h-7">
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                           />
                        </svg>
                        <span className="text-lg font-semibold">목록</span>
                     </button>
                  </div>

                  {/* 댓글 입력 */}
                  <div className="mt-14">
                     <label className="text-lg font-semibold mb-2 flex items-center space-x-2">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           fill="none"
                           viewBox="0 0 24 24"
                           strokeWidth="1.5"
                           stroke="currentColor"
                           className="size-6">
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                           />
                        </svg>

                        <span>Message</span>
                     </label>

                     <div className="flex flex-col gap-4">
                        <textarea
                           value={commentContent}
                           onChange={(e) => setCommentContent(e.target.value)}
                           placeholder="댓글을 입력하세요..."
                           className="w-full p-3 border border-gray-300 rounded-md mb-1"
                        />
                        <button
                           onClick={handleCommentSubmit}
                           className="bg-sky-500 text-white px-6 py-2 rounded-3xl ml-auto hover:bg-sky-600">
                           댓글 달기
                        </button>
                     </div>
                  </div>

                  <div className="mt-6">
                     {comments.length > 0 ? (
                        comments.map((comment) => (
                           <div key={comment._id} className="mb-4 pb-4 border-b border-gray-300">
                              {" "}
                              {/* 댓글 작성자 프로필 이미지와 이름 */}
                              <div className="flex items-center mb-2">
                                 {/* 프로필 이미지 */}
                                 <div className="mr-3 w-10 h-10 rounded-full overflow-hidden">
                                    <Image
                                       src={comment.author.image || "/images/default_profile.png"} // 이미지가 없을 경우 기본 이미지
                                       alt={comment.author.username || comment.author.fullName}
                                       width={40}
                                       height={40}
                                       className="object-cover"
                                    />
                                 </div>

                                 {/* 댓글 작성자 이름 */}
                                 <div className="font-semibold text-gray-700">
                                    {comment.author.username || comment.author.fullName}
                                 </div>
                              </div>
                              {/* 댓글 내용 */}
                              <p className="text-gray-600 mb-2">{comment.comment}</p>
                              <span className="text-sm text-gray-400">{formatDate(comment.createdAt)}</span>
                              {/* 댓글 삭제 버튼: 본인 작성 댓글만 보이게 */}
                              {comment.author._id === localStorage.getItem("userId") && (
                                 <button
                                    onClick={() => handleDeleteComment(comment._id, comment.author._id)}
                                    className="text-red-500 text-sm mt-2 mx-2">
                                    삭제
                                 </button>
                              )}
                           </div>
                        ))
                     ) : (
                        <p className="text-center">댓글이 없습니다.</p>
                     )}
                  </div>
               </>
            ) : (
               <p className="text-gray-500 text-center">게시글을 찾을 수 없습니다.</p>
            )}
         </div>
         <Footer />
      </div>
   );
}
