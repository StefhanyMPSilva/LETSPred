import {  Github, Mail, UserRoundPen, type LucideIcon } from "lucide-react";
import lattesIcon from "../../../src/assets/lattes.svg";
import marcosPhoto from "../../../src/assets/photos/marcos.svg";
import viniciusPhoto from "../../../src/assets/photos/vinicius.svg";
import stephanyPhoto from "../../../src/assets/photos/stephany.svg";
import isaquePhoto from "../../../src/assets/photos/isaque.svg";
import camiloPhoto from "../../../src/assets/photos/camilo.svg";
import aryanePhoto from "../../../src/assets/photos/aryane.svg";
import josePhoto from "../../../src/assets/photos/jose.svg";

//import usePhoto from "../../../src/assets/photos/user.png";

interface ContactCardProps{
    imgSrc: string;
    name: string;
    activity: string;
    description: string;
    icon: LucideIcon;
    lattesLink: string;
    email: string;
}

const ContactCard = ({imgSrc, name, activity, description, icon: Icon, email, lattesLink}: ContactCardProps) => {
    return(
        <section className="w-full mb-6 p-10 max-s1024:p-4 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="flex gap-6 max-s780:flex-col max-s780:items-center max-s780:text-center">
                <div className="relative inline-block">
                    <img src={imgSrc} alt={name} className="w-24 h-24 max-s1024:w-16 max-s1024:h-16 object-cover"/>
                    <a href={lattesLink} target="_blank">
                        <img src={lattesIcon} alt={`lattes-${name}`} className="absolute -bottom-2 -right-1 w-10 h-10 max-s1024:w-7 max-s1024:h-7"/>
                    </a>
                </div>
                <div>
                    <p className="mt-2 font-inter font-semibold text-3xl max-s1024:text-xl">{name}</p>
                    <p className="mt-1 font-poppins font-semibold text-xl text-blue-400 max-s1024:text-base">{activity}</p>
                </div>
            </div>
            <p className="mt-6 text-justify text-gray-600 text-sm">{description}</p>
            <div className="mt-10">
                <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-[10px]">
                    <Icon className="text-gray-600"/>
                    <p className="font-rubik text-gray-600">{email}</p>
                </div>
            </div>
        </section>
    );
}

export function ContactContent() {
  return (
    <>
        <div className="flex items-center gap-3 mb-6">
          <UserRoundPen className="w-8 h-8 text-orange-400" />
          <h1 className="text-4xl max-s1024:text-2xl font-semibold font-inter text-gray-800"> Contact </h1>
        </div>
            <section className="flex flex-wrap max-s1280:grid max-s1280:grid-cols-1 items-center gap-8">
                    <ContactCard 
                        imgSrc={stephanyPhoto}
                        name="Stefhany Silva"
                        activity="IT manager"
                        description="Systems Analyst with experience in network support, communications and usability."
                        email="stefhanypaixao@gmail.com"
                        lattesLink="http://lattes.cnpq.br/5306683434371449"
                        icon={Mail}
                    />

                    <ContactCard 
                        imgSrc={aryanePhoto}
                        name="Aryane Vilhena"
                        activity="IT consultant"
                        description="Systems Analyst with experience in systems development, software engineering and database management."
                        email="aryanevilhena@gmail.com"
                        lattesLink="http://lattes.cnpq.br/6176555341357855"
                        icon={Mail}
                    />
                    
                    <ContactCard 
                        imgSrc={marcosPhoto}
                        name="Marcos Costa"
                        activity="Support"
                        description="Researcher and developer, focused on the development of automated tools."
                        email="marcosnandosc@gmail.com"
                        lattesLink="http://lattes.cnpq.br/0135541040353657"
                        icon={Mail}
                    />

                    <ContactCard 
                        imgSrc={isaquePhoto}
                        name="Isaque Costa"
                        activity="Support"
                        description="Undergraduate student in Information Systems, with experience in software development using Python and programming logic."
                        email="isaquecosta131105@gmail.com"
                        lattesLink="http://lattes.cnpq.br/7136210605828432"
                        icon={Mail}
                    />

                    <ContactCard 
                        imgSrc={josePhoto}
                        name="José Perdigão"
                        activity="Support"
                        description="Systems developer with experience in areas such as bioinformatics (metagenomics), computer vision and applied data science."
                        email="joseperdigao.dev@gmail.com"
                        lattesLink="https://lattes.cnpq.br/94534577374448422"
                        icon={Mail}
                    />

                    <ContactCard 
                        imgSrc={camiloPhoto}
                        name="Dr. Camilo Lima"
                        activity="Advisor"
                        description="Researcher in the fields of Organic Chemistry, Medicinal Chemistry and Drug Chemistry, specialising in the development of new bioactive compounds to combat neglected diseases and in Molecular Drug Modelling."
                        email="camilolima@iq.ufrj.br"
                        lattesLink="http://lattes.cnpq.br/4430323583603846"
                        icon={Mail}
                    />

                    <ContactCard 
                        imgSrc={viniciusPhoto}
                        name="Dr. Vinícius Abreu"
                        activity="Advisor"
                        description="Researcher in Bioinformatics, specialising in the development of computational tools and workflows for the analysis of biological data."
                        email="vabreu@ufpa.br"
                        lattesLink="http://lattes.cnpq.br/2484200467965399"
                        icon={Mail}
                    />

                     <section className="w-full mb-6 p-10 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                        <div className="flex gap-6">
                            <div className="relative inline-block">
                                <Github className="w-16 h-16 object-cover"/>
                            </div>
                            <div>
                                <p className="mt-2 font-inter font-semibold text-xl">Github</p>
                                <p className="mt-1 font-rubik font-semibold text-blue-500">Repository</p>
                            </div>
                        </div>
                        <p className="mt-4 text-gray-600 text-justify text-sm">Report issues or contribute to the codebase.</p>
                        
                        <div className="mt-10">
                            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="p-4 flex items-center justify-center gap-2  cursor-pointer rounded-[10px] font-semibold font-rubik transition-all duration-200 border border-gray-300 hover:bg-blue-100/70">
                                <Github className="w-4 h-4 text-blue-700"/>
                                <p className="font-inter font-semibold">Open Github</p>
                            </a>
                        </div>
                    </section>
                </section>
    </>
  );
}