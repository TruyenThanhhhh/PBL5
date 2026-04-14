import React, { useState } from 'react';
import { 
  Bell, Search, MapPin, X, Upload, ChevronDown
} from 'lucide-react';

export default function PostUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedImage(URL.createObjectURL(e.dataTransfer.files[0]));
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900 pb-12">
      {/* NAVBAR */}
      <header className="flex items-center justify-between py-3 px-6 bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-8 w-1/3">
          <a href="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">
            The Wanderer
          </a>
        </div>

        <div className="flex-1 max-w-2xl relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search destinations..." 
            className="w-full pl-11 pr-4 py-2.5 bg-[#f4f4f5] border-transparent rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 font-medium placeholder-gray-400 transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-6 w-1/3">
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-900 relative">
              <Bell size={20} />
            </button>
            <a href="/profile" className="block cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                className="w-8 h-8 rounded-full border border-gray-200 object-cover hover:ring-2 hover:ring-[#f44336]/50 transition-all"
                alt="Profile"
              />
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[800px] mx-auto px-4 sm:px-6 pt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Create a New Post</h1>
          <p className="text-[14px] text-gray-500 font-medium">Share your latest discovery with the community.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            {/* IMAGE UPLOAD AREA */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Cover Image</label>
              <div 
                className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center transition-colors cursor-pointer ${dragActive ? 'border-[#f44336] bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedImage ? (
                  <div className="relative w-full">
                    <img src={selectedImage} alt="Preview" className="w-full h-[300px] object-cover rounded-xl" />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-3 right-3 bg-white text-gray-800 p-1.5 rounded-full shadow-md hover:text-red-500 transition-colors"
                      type="button"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={48} className="text-gray-400 mb-4" strokeWidth={1.5} />
                    <p className="text-[14px] font-bold text-gray-700 mb-1">Drag and drop your image here</p>
                    <p className="text-[12px] text-gray-500 font-medium mb-4">High quality JPG, PNG, or GIF (Max 10MB)</p>
                    <label className="bg-white border border-gray-200 text-gray-700 text-[13px] font-bold py-2 px-5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                      Browse Files
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedImage(URL.createObjectURL(e.target.files[0]));
                        }
                      }} />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* TITLE & LOCATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Post Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Hidden Gem in Kyoto" 
                  className="w-full px-4 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all font-medium placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <MapPin size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search a place..." 
                    className="w-full pl-10 pr-4 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all font-medium placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Category</label>
              <div className="relative">
                <select 
                  defaultValue="" 
                  className="w-full px-4 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all font-bold text-gray-700 appearance-none"
                >
                  <option value="" disabled>Select a category</option>
                  <option value="hiking">Hiking</option>
                  <option value="local-eats">Local Eats</option>
                  <option value="photography">Photography</option>
                  <option value="hidden-gems">Hidden Gems</option>
                  <option value="backpacking">Backpacking</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* CONTENT */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Your Story</label>
              <textarea 
                rows="6"
                placeholder="Share your experience, tips, and details about this place..." 
                className="w-full px-4 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all font-medium placeholder-gray-400 resize-none"
              ></textarea>
            </div>

            {/* SUBMIT BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <a href="/dashboard" className="px-6 py-3 text-[14px] font-bold text-gray-500 hover:text-gray-800 transition-colors">
                Cancel
              </a>
              <button type="submit" className="bg-[#f44336] text-white text-[14px] font-bold py-3 px-8 rounded-xl hover:bg-[#e53935] shadow-md shadow-red-500/20 transition-colors">
                Publish Post
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}