'use client';

import React, { useState } from 'react';
import {
    Database,
    Download,
    Upload,
    RefreshCcw,
    AlertCircle,
    CheckCircle2,
    HardDrive,
    FileUp
} from 'lucide-react';
import { databaseService } from '@/lib/services/databaseService';
import { toast } from 'sonner';

export default function DatabaseManagementPage() {
    const [loading, setLoading] = useState(false);
    const [lastBackupName, setLastBackupName] = useState<string | null>(null);

    const handleBackup = async () => {
        setLoading(true);
        try {
            const result = await databaseService.backup();
            setLastBackupName(result.fileName);
            toast.success('Backup created successfully');
        } catch (error: any) {
            toast.error('Backup failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleUploadBak = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setLoading(true);
        try {
            const result = await databaseService.uploadBak(e.target.files[0]);
            setLastBackupName(result.fileName);
            toast.success('Backup file uploaded and ready for restore');
        } catch (error: any) {
            toast.error('Upload failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleRestore = async () => {
        if (!lastBackupName) {
            toast.error('No backup file selected or found in memory');
            return;
        }

        if (!confirm(`Are you sure you want to restore from ${lastBackupName}? This will overwrite current data!`)) return;

        setLoading(true);
        try {
            await databaseService.restore(lastBackupName);
            toast.success('Database restored successfully');
        } catch (error: any) {
            toast.error('Restore failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!lastBackupName) return;
        try {
            await databaseService.downloadBackup(lastBackupName);
        } catch (error: any) {
            toast.error('Download failed');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Database className="w-8 h-8 text-primary" />
                        Database Management
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Create backups or upload existing .bak files to restore your database.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Create Backup Card */}
                <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <Download className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold">Generate Backup</h2>
                    </div>

                    <p className="text-sm text-muted-foreground mb-8 min-h-[48px]">
                        Generate a fresh .bak file of the current database state and save it to the server.
                    </p>

                    <button
                        onClick={handleBackup}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                        {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <HardDrive className="w-5 h-5" />}
                        Create New .bak Backup
                    </button>
                </div>

                {/* Upload Backup Card */}
                <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
                            <FileUp className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold">Upload & Restore</h2>
                    </div>

                    <p className="text-sm text-muted-foreground mb-8 min-h-[48px]">
                        Upload an external .bak file from your computer to prepare it for restoration.
                    </p>

                    <div className="relative group">
                        <input
                            type="file"
                            accept=".bak"
                            onChange={handleUploadBak}
                            disabled={loading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            id="bak-upload"
                        />
                        <label
                            htmlFor="bak-upload"
                            className="w-full flex items-center justify-center gap-2 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 py-3 px-4 rounded-xl font-medium transition-all group-hover:shadow-lg text-center"
                        >
                            <Upload className="w-5 h-5" />
                            Upload Local .bak File
                        </label>
                    </div>
                </div>
            </div>

            {/* Dynamic Action Section */}
            {lastBackupName && (
                <div className="bg-muted/50 border rounded-2xl p-6 border-dashed border-2 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-full text-green-500">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Currently Selected File</p>
                                <h3 className="text-lg font-mono font-bold text-foreground truncate max-w-md">{lastBackupName}</h3>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <button
                                onClick={handleRestore}
                                disabled={loading}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-500 text-white hover:bg-amber-600 py-3 px-6 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                Restore This Backup Now
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={loading}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-900 py-3 px-6 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Download className="w-5 h-5" />
                                Download to PC
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-amber-50 border-amber-200 border rounded-2xl p-6 flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-amber-900 text-lg">Important Safety Notice</h3>
                    <ul className="text-sm text-amber-800 mt-2 space-y-1 list-disc list-inside">
                        <li><strong>Data Loss:</strong> Restoring will permanently overwrite all current database data.</li>
                        <li><strong>File Support:</strong> Only standard SQL Server <code>.bak</code> files are supported.</li>
                        <li><strong>Service Interruption:</strong> The system will temporarily disconnect all active users during restoration.</li>
                        <li><strong>Precaution:</strong> Always create a fresh "Download to PC" backup before restoring an uploaded file.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
