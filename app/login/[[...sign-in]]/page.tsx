import { SignIn } from "@clerk/nextjs";
import Navigation from '../../components/Navigation';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <Navigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex justify-center">
            <SignIn appearance={{
              elements: {
                formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-sm normal-case',
                card: 'shadow-none',
                headerTitle: 'text-indigo-600',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'border-gray-300 text-gray-600',
                formFieldInput: 'text-black placeholder-neutral-600',
                footerActionLink: 'text-indigo-600 hover:text-indigo-700',
              }
            }} />
          </div>
        </div>
      </main>
      
      {/* Footer component would go here */}
    </div>
  );
} 