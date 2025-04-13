const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <div className="p-8 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition duration-300">
    <h3 className="text-2xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default FeatureCard;