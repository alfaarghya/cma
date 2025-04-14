
import { Message } from "@cma/types/clientTypes";
import ReactMarkdown from "react-markdown";

const RenderMessage = ({
  msg,
  i,
  currentUserId,
}: {
  msg: Message;
  i: number;
  currentUserId: string;
}) => {
  const isCurrentUser = msg.senderId === currentUserId;

  return (
    <div
      key={i}
      className={`flex flex-col max-w-[60%] p-2 rounded ${isCurrentUser
        ? "ml-auto bg-blue-100 text-right"
        : "mr-auto bg-gray-100 text-left"
        }`}
    >
      <p className="text-xs font-semibold text-gray-600 mb-1">{msg.sender}</p>

      <ReactMarkdown
        components={{
          strong: ({ ...props }) => (
            <strong className="font-bold" {...props} />
          ),
          em: ({ ...props }) => (
            <em className="italic" {...props} />
          ),
          code: ({ ...props }) => (
            <code
              className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm"
              {...props}
            />
          ),
          p: ({ ...props }) => (
            <p className="text-sm text-gray-800" {...props} />
          ),
        }}
      >
        {msg.content}
      </ReactMarkdown>

      <p className="text-[10px] text-gray-500 mt-1">
        {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
      </p>
    </div>
  );
};

export default RenderMessage;
