import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Moon, MapPin, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';

interface NightStay {
    date: string;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    distanceFromHome: number;
}

export function Nights() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [nights, setNights] = useState<NightStay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchNights();
    }, [year]);

    const fetchNights = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`/api/nights/${year}`);
            setNights(response.data);
        } catch (err: any) {
            console.error('Error fetching nights:', err);
            setError('Failed to load nights data');
        } finally {
            setLoading(false);
        }
    };

    const totalNights = nights.length;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-indigo-900">
                    <Moon className="text-indigo-600" size={32} />
                    Nights Away
                </h1>
                <p className="text-gray-600 mt-2">
                    Tracking nights spent away from home (23:00 - 06:00)
                </p>
            </div>

            {/* Year Selector */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-8">
                <button
                    onClick={() => setYear(year - 1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800">{year}</h2>
                <button
                    onClick={() => setYear(year + 1)}
                    disabled={year >= new Date().getFullYear()}
                    className={`p-2 rounded-full transition-colors ${year >= new Date().getFullYear()
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                >
                    <ArrowRight size={24} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">
                        Total Nights
                    </div>
                    <div className="text-4xl font-bold">{totalNights}</div>
                    <div className="mt-2 text-indigo-200 text-sm">
                        Away from home in {year}
                    </div>
                </div>

                {/* Placeholder for more stats if needed */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
                        Most Visited
                    </div>
                    <div className="text-xl font-semibold text-gray-800">
                        {/* Logic to find most visited place could go here */}
                        -
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
                        Longest Streak
                    </div>
                    <div className="text-xl font-semibold text-gray-800">
                        {/* Logic for streak could go here */}
                        -
                    </div>
                </div>
            </div>

            {/* Nights List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">History</h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                ) : nights.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No nights away recorded for this year.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {nights.map((night, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Calendar size={20} className="text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                        {format(new Date(night.date), 'EEEE, MMMM d, yyyy')}
                                    </div>
                                    <div className="text-gray-600 flex items-center gap-1 mt-1">
                                        <MapPin size={16} />
                                        {night.location.address || 'Unknown Location'}
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">
                                        {Math.round(night.distanceFromHome)} km from home
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
