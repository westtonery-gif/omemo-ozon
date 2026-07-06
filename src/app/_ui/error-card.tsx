// Карточка с сообщением об ошибке загрузки данных. Server Component.

export default function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      {message}
    </div>
  );
}
