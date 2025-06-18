import React, { useState } from "react";
import { useUserScore } from "../hooks/useUserScore";

interface NicknameInputProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const NicknameInput: React.FC<NicknameInputProps> = ({ isOpen, onClose, onSuccess }) => {
    const { setUser, isLoading, error, clearError } = useUserScore();
    const [nickname, setNickname] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) return;

        const success = await setUser(nickname.trim());
        if (success) {
            setNickname("");
            onSuccess();
            onClose();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(e.target.value);
        if (error) clearError();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-xl p-8 max-w-md w-full">
                {/* 헤더 */}
                <div className="text-center mb-6">
                    <div className="text-4xl mb-3">🎮</div>
                    <h2 className="text-2xl font-bold text-white mb-2">플레이어 이름</h2>
                    <p className="text-gray-300 text-sm">게임을 시작하기 전에 닉네임을 입력해주세요</p>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nickname" className="block text-white font-medium mb-2">
                            닉네임
                        </label>
                        <input
                            id="nickname"
                            type="text"
                            value={nickname}
                            onChange={handleInputChange}
                            placeholder="닉네임을 입력하세요"
                            maxLength={20}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg 
                                     text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                                     focus:ring-cyan-400 focus:border-transparent transition-all"
                            disabled={isLoading}
                            autoFocus
                        />
                        <div className="text-right text-xs text-gray-400 mt-1">{nickname.length}/20</div>
                    </div>

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                            <div className="text-red-300 text-sm text-center">{error}</div>
                        </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium 
                                     py-3 px-4 rounded-lg transition-colors"
                            disabled={isLoading}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={!nickname.trim() || isLoading}
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 
                                     hover:from-cyan-600 hover:to-blue-700 text-white font-medium 
                                     py-3 px-4 rounded-lg transition-all transform hover:scale-105 
                                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? "설정 중..." : "시작하기"}
                        </button>
                    </div>
                </form>

                {/* 안내 문구 */}
                <div className="mt-6 pt-4 border-t border-white/20">
                    <div className="text-xs text-gray-400 text-center space-y-1">
                        <div>• 닉네임은 2-20자까지 가능합니다</div>
                        <div>• 점수는 자동으로 기록됩니다</div>
                        <div>• 같은 닉네임으로 여러 번 플레이할 수 있습니다</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NicknameInput;
