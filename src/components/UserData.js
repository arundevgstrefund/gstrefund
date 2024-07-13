// src/components/UserData.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserData = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await axios.get('http://localhost:5000/userdata');
      setUsers(response.data);
    };

    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">User Data</h2>
      <table className="min-w-full bg-white">
           <thead>
             <tr>
               <th className="py-2 px-4">Name</th>
               <th className="py-2 px-4">Email</th>
               <th className="py-2 px-4">Phone</th>
               <th className="py-2 px-4">GSTIN</th>
               <th className="py-2 px-4">Refund Type</th>
               <th className="py-2 px-4">From Date</th>
               <th className="py-2 px-4">To Date</th>
             </tr>
           </thead>
           <tbody>
             {users.map((user) => (
               <tr key={user._id}>
                 <td className="border px-4 py-2">{user.name}</td>
                 <td className="border px-4 py-2">{user.email}</td>
                 <td className="border px-4 py-2">{user.phone}</td>
                 <td className="border px-4 py-2">{user.gstin}</td>
                 <td className="border px-4 py-2">{user.refundType}</td>
                 <td className="border px-4 py-2">{new Date(user.fromDate).toLocaleDateString()}</td>
                 <td className="border px-4 py-2">{new Date(user.toDate).toLocaleDateString()}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
       
     );
   };

   export default UserData;
