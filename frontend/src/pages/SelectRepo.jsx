// import React, { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { useSearchParams } from "react-router-dom";

// const SelectRepo = () => {
//   const [repos, setRepos] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [searchParams] = useSearchParams();
//   const token = searchParams.get("token") || "";

//   // Prevent double fetch in React Strict Mode (dev only)
//   const didFetch = useRef(false);

//   useEffect(() => {

//   console.log("TOKEN:", token);

//   if (!token) {
//     console.error("No token found!");
//     return;
//   }

//   axios.get(`/api/github/repos?token=${token}`)

//     .then((res) => {
//       console.log("Repos received:", res.data);
//       setRepos(res.data);
//     })
//     .catch((err) => {
//       console.error("Failed to load repos", err);
//     });

// }, [token]);


//   const connectRepo = async (owner, repo) => {
//     if (!token) {
//       alert("Token missing. Cannot connect repo.");
//       return;
//     }
//     try {
//       setLoading(true);
//       const res = await axios.post(
//         `api/github/connect-repo?token=${encodeURIComponent(token)}`,
//         { owner, repo },
//         {
//           headers: { "Content-Type": "application/json" },
//           validateStatus: () => true,
//         }
//       );

//       console.log("connect-repo status", res.status, "data", res.data);

//       if (res.status >= 400) {
//         alert(`Failed to connect repo: ${res.status}. Check console for details.`);
//         return;
//       }

//       alert("Repo connected successfully!");
//     } catch (err) {
//       console.error("connectRepo error", err);
//       alert("Network error while connecting repo. See console.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <h2>Your GitHub Repositories</h2>

//       {loading && <p>Loading…</p>}

//       {error && (
//         <div style={{ color: "crimson", marginBottom: 12 }}>
//           <strong>Error:</strong> {error}
//         </div>
//       )}

//       {!loading && !error && repos.length === 0 && (
//         <div>
//           <p>No repositories found.</p>
//           <p>
//             Open browser network devtools → select the `repos` request and check Response / Headers /
//             Preview. Also check backend logs for `REPO RESPONSE:`.
//           </p>
//         </div>
//       )}

//       <div>
//         {repos?.map((r) => (
//   <div key={r.id}>
//     {r.full_name}
//     <button onClick={() => connectRepo(r.owner.login, r.name)}>
//       Connect
//     </button>
//   </div>
// ))}

//       </div>
//     </div>
//   );
// };

// export default SelectRepo;
