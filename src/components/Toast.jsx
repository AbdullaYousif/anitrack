function Toast({message}) {
    return (
<div className="fixed bottom-6 right-6 bg-gray-800 rounded-lg shadow-lg px-4 py-2 animate-card-in border-l-4 border-green-500">
    <p className="text-white font-bold ">{message}</p>
</div>
    )
}

export default Toast;